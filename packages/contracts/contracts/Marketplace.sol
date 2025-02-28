// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IMarketplace} from "./interfaces/IMarketplace.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Marketplace is IMarketplace {
    IERC20 public paymentToken;

    uint256 public offerCount;
    mapping(uint256 => Offer) public offers;

    uint256 public orderCount;
    mapping(uint256 => Order) public orders;
    mapping(address => uint256[]) private clientOrders;
    mapping(address => uint256[]) private vendorOrders;


    /// @notice Only vendor
    modifier onlyOfferVendor(uint256 _offerId) {
        if (offers[_offerId].vendor != msg.sender) {
            revert Unauthorized("Only vendor");
        }
        _;
    }

    /// @notice Only vendor or client
    modifier onlyVendorOrClient(uint256 _orderId) {
        Order memory order = orders[_orderId];
        Offer memory offer = offers[order.offerId];

        if (order.client != msg.sender && offer.vendor != msg.sender) {
            revert Unauthorized("Only vendor or client");
        }
        _;
    }

    constructor(IERC20 _paymentToken) {
        paymentToken = _paymentToken;
    }

    /// @inheritdoc IMarketplace
    function createOffer(
        uint256 _pricePerHour,
        uint256 _deploymentFee,
        uint256 _fulfillmentTime,
        uint256 _units
    ) public returns (uint256) {
        uint256 offerId = offerCount;
        offers[offerId] = Offer({
            vendor: msg.sender,
            pricePerHour: _pricePerHour,
            remainingUnits: _units,
            deploymentFee: _deploymentFee,
            fulfillmentTime: _fulfillmentTime
        });
        offerCount += 1;

        emit NewOffer(
            msg.sender,
            offerId,
            _pricePerHour,
            _deploymentFee,
            _fulfillmentTime,
            _units
        );

        return offerId;
    }

    /// @inheritdoc IMarketplace
    function setOfferRemainingUnits(
        uint256 _offerId,
        uint256 _remainingUnits
    ) public onlyOfferVendor(_offerId) {
        offers[_offerId].remainingUnits = _remainingUnits;
    }

    /// @inheritdoc IMarketplace
    function createOrder(
        uint256 _offerId,
        uint256 _initialDeposit
    ) public returns (uint256) {
        Offer storage offer = offers[_offerId];

        // verify offer still available
        if (offer.remainingUnits == 0) {
            revert OfferNotFound();
        }
        offer.remainingUnits -= 1;

        // pull funds
        if (_initialDeposit < offer.deploymentFee) {
            revert InsufficientBalance(msg.sender, offer.deploymentFee);
        }
        paymentToken.transferFrom(msg.sender, address(this), _initialDeposit);

        // create order
        uint256 orderId = orderCount;
        orders[orderId] = Order({
            client: msg.sender,
            offerId: _offerId,
            createdAt: block.timestamp,
            fulfilledAt: 0,
            terminatedAt: 0,
            lastWithdrawal: 0,
            balance: _initialDeposit,
            metadata: ""
        });
        orderCount += 1;

        clientOrders[msg.sender].push(orderId);
        vendorOrders[offer.vendor].push(orderId);

        emit NewOrder(offer.vendor, msg.sender, orderId);

        return orderId;
    }

    /// @inheritdoc IMarketplace
    function fulfillOrder(
        uint256 _orderId,
        string calldata _metadata
    ) public onlyOfferVendor(orders[_orderId].offerId) {
        Order storage order = orders[_orderId];
        Offer memory offer = offers[order.offerId];

        // set order metadata, deployment links, addresses, etc
        order.metadata = _metadata;

        // transfer deployment fee and start payments
        order.fulfilledAt = block.timestamp;
        order.lastWithdrawal = block.timestamp;
        order.balance -= offer.deploymentFee;
        paymentToken.transfer(offer.vendor, offer.deploymentFee);

        emit OrderFulfilled(offer.vendor, order.client, _orderId);
    }

    /// @inheritdoc IMarketplace
    function terminateOrder(
        uint256 _orderId
    ) public onlyVendorOrClient(_orderId) {
        Order storage order = orders[_orderId];
        Offer memory offer = offers[order.offerId];

        // cannot terminate if not fulfilled and within fulfillment time
        if (offer.fulfillmentTime < (block.timestamp - order.fulfilledAt)) {
            revert OrderNotFulfilled();
        }

        // empty balances
        paymentToken.transfer(order.client, balanceOf(order.client, _orderId));
        paymentToken.transfer(offer.vendor, balanceOf(offer.vendor, _orderId));

        // we can already terminate
        order.terminatedAt = block.timestamp;
        order.balance = 0;

        emit OrderTerminated(
            offers[order.offerId].vendor,
            order.client,
            _orderId
        );
    }

    /// @inheritdoc IMarketplace
    function deposit(uint256 _orderId, uint256 _amount) public {
        Order storage order = orders[_orderId];

        // revert if already terminated
        if (order.terminatedAt != 0) {
            revert OrderAlreadyTerminated();
        }

        paymentToken.transferFrom(msg.sender, address(this), _amount);
        order.balance += _amount;

        emit Deposit(_orderId, _amount);
    }

    /// @inheritdoc IMarketplace
    function withdraw(uint256 _orderId, uint256 _amount) public onlyVendorOrClient(_orderId) {
        Order storage order = orders[_orderId];

        // revert if already terminated
        if (order.terminatedAt != 0) {
            revert OrderAlreadyTerminated();
        }

        // reverts if not fulfilled and within fulfillment time
        if (
            order.fulfilledAt == 0 &&
            (block.timestamp - order.createdAt) <
            offers[order.offerId].fulfillmentTime
        ) {
            revert OrderNotFulfilled();
        }

        uint256 maxWithdrawal = balanceOf(msg.sender, _orderId);
        if (_amount > maxWithdrawal) {
            revert InsufficientBalance(msg.sender, maxWithdrawal);
        }

        // update order balance
        order.balance -= _amount;

        // update lastWithdrawal only if vendor
        if (msg.sender != order.client) {
            order.lastWithdrawal = block.timestamp;
        }

        // transfer tokens
        paymentToken.transfer(msg.sender, _amount);

        emit Withdrawal(msg.sender, _orderId, _amount);
    }

    /// @inheritdoc IMarketplace
    function balanceOf(
        address _address,
        uint256 _orderId
    ) public view returns (uint256 balance) {
        Order memory order = orders[_orderId];
        Offer memory offer = offers[order.offerId];

        // if not fulfilled all is still available
        if (order.fulfilledAt == 0) {
            return _address == order.client ? order.balance : 0;
        } 

        uint256 hoursElapsed = (block.timestamp -
            order.lastWithdrawal +
            3600 -
            1) / 3600;
        uint256 acc = hoursElapsed * offer.pricePerHour;

        if (_address == offer.vendor) {
            return acc > order.balance ? order.balance : acc;
        } else if (_address == order.client) {
            return acc > order.balance ? 0 : order.balance - acc;
        }
    }
    
    /// @inheritdoc IMarketplace
    function getClientOrders(address _user) external view returns (uint256[] memory) {
        return clientOrders[_user];
    }

    /// @inheritdoc IMarketplace
    function getVendorOrders(address _user) external view returns (uint256[] memory) {
        return vendorOrders[_user];
    }
}
