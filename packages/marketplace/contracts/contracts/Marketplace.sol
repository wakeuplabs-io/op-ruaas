// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IMarketplace} from "./interfaces/IMarketplace.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Marketplace is IMarketplace, ReentrancyGuard {
    IERC20 public paymentToken;

    uint256 public offerCount;
    mapping(uint256 => Offer) public offers;

    uint256 public orderCount;
    mapping(uint256 => Order) public orders;
    mapping(address => uint256[]) private clientOrders;
    mapping(address => uint256[]) private vendorOrders;

    /// @notice 24 hours for the fulfillment of the order. If the vendor does not fulfill the order within this time, user can withdraw it all.
    uint256 public constant FULFILLMENT_PERIOD = 24 * 60 * 60;

    /// @notice 48 hours for the verification of the order after fulfillment. Within this time the user can terminate the order withdrawing it all.
    uint256 public constant VERIFICATION_PERIOD = 2 * 24 * 60 * 60;

    /// @notice Only vendor
    modifier onlyVendor(uint256 _offerId, uint256 _orderId) {
        if (
            offers[_offerId].vendor != msg.sender &&
            offers[orders[_orderId].offerId].vendor != msg.sender
        ) {
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
        uint256 _pricePerMonth,
        uint256 _units,
        string calldata _metadata
    ) public returns (uint256) {
        uint256 offerId = offerCount;
        offers[offerId] = Offer({
            vendor: msg.sender,
            pricePerMonth: _pricePerMonth,
            remainingUnits: _units,
            metadata: _metadata
        });
        offerCount += 1;

        emit NewOffer(msg.sender, offerId, _pricePerMonth, _units);

        return offerId;
    }

    /// @inheritdoc IMarketplace
    function setOfferRemainingUnits(
        uint256 _offerId,
        uint256 _remainingUnits
    ) public onlyVendor(_offerId, 0) {
        offers[_offerId].remainingUnits = _remainingUnits;
    }

    /// @inheritdoc IMarketplace
    function createOrder(
        uint256 _offerId,
        uint256 _initialCommitment,
        string calldata _setupMetadata
    ) public returns (uint256) {
        Offer storage offer = offers[_offerId];

        // verify offer still available
        if (offer.remainingUnits == 0) {
            revert OfferNotFound();
        }
        offer.remainingUnits -= 1;

        // create order
        uint256 orderId = _createOrder(
            _offerId,
            _initialCommitment,
            _setupMetadata
        );

        // pull funds
        paymentToken.transferFrom(
            msg.sender,
            address(this),
            _initialCommitment * offer.pricePerMonth
        );

        return orderId;
    }

    /// @inheritdoc IMarketplace
    function fulfillOrder(
        uint256 _orderId,
        string calldata _deploymentMetadata
    ) public onlyVendor(0, _orderId) {
        Order storage order = orders[_orderId];
        Offer memory offer = offers[order.offerId];

        if (order.fulfilledAt != 0) {
            revert OrderAlreadyFulfilled();
        } else if (order.terminatedAt != 0) {
            revert OrderAlreadyTerminated();
        } else if (order.createdAt + FULFILLMENT_PERIOD < block.timestamp) {
            revert FulfillmentPeriodExpired();
        }

        // set deployment metadata, deployment links, addresses, etc
        order.deploymentMetadata = _deploymentMetadata;
        order.fulfilledAt = block.timestamp;

        emit OrderFulfilled(offer.vendor, order.client, _orderId);
    }

    /// @inheritdoc IMarketplace
    function terminateOrder(
        uint256 _orderId
    ) public onlyVendorOrClient(_orderId) nonReentrant {
        Order storage order = orders[_orderId];
        Offer memory offer = offers[order.offerId];

        uint256 timeSinceFulfilled = block.timestamp - order.fulfilledAt;

        // cannot terminate if not fulfilled and within fulfillment time.
        if (order.fulfilledAt == 0 && timeSinceFulfilled > FULFILLMENT_PERIOD) {
            revert OrderNotFulfilled();
        }

        if (timeSinceFulfilled > VERIFICATION_PERIOD) {
            paymentToken.transfer(
                order.client,
                balanceOf(order.client, _orderId)
            );
            paymentToken.transfer(
                offer.vendor,
                balanceOf(offer.vendor, _orderId)
            );
        } else {
            paymentToken.transfer(order.client, order.balance);
        }

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
    function withdraw(
        uint256 _orderId,
        uint256 _amount
    ) public onlyVendor(0, _orderId) nonReentrant {
        Order storage order = orders[_orderId];

        // revert if already terminated
        if (order.terminatedAt != 0) {
            revert OrderAlreadyTerminated();
        } else if (
            order.fulfilledAt == 0 &&
            (block.timestamp - order.createdAt) < FULFILLMENT_PERIOD
        ) {
            // reverts if not fulfilled and within fulfillment time
            revert OrderNotFulfilled();
        } else if (block.timestamp - order.fulfilledAt < VERIFICATION_PERIOD) {
            // cannot withdraw during verification period
            revert OrderNotVerified();
        }

        uint256 maxWithdrawal = balanceOf(msg.sender, _orderId);
        if (_amount > maxWithdrawal) {
            revert InsufficientBalance(msg.sender, maxWithdrawal);
        }

        // update order balance
        order.balance -= _amount;
        order.lastWithdrawal = block.timestamp;

        // transfer tokens
        paymentToken.transfer(msg.sender, _amount);

        emit Withdrawal(msg.sender, _orderId, _amount);
    }

    /// @inheritdoc IMarketplace
    function balanceOf(
        address _address,
        uint256 _orderId
    ) public view returns (uint256) {
        Order memory order = orders[_orderId];
        Offer memory offer = offers[order.offerId];

        // if not fulfilled all is still available
        if (order.fulfilledAt == 0) {
            return _address == order.client ? order.balance : 0;
        }

        uint256 monthsElapsed = (block.timestamp -
            order.lastWithdrawal +
            2592000 -
            1) / 2592000; // 2592000 = 30 days * 24 hours * 3600 seconds
        uint256 acc = monthsElapsed * offer.pricePerMonth;

        if (_address == offer.vendor) {
            return acc > order.balance ? order.balance : acc;
        } else {
            return acc > order.balance ? 0 : order.balance - acc;
        }
    }

    /// @inheritdoc IMarketplace
    function getOrder(
        uint256 _orderId
    ) public view returns (OrderWithOffer memory) {
        return
            OrderWithOffer({
                id: _orderId,
                client: orders[_orderId].client,
                offerId: orders[_orderId].offerId,
                createdAt: orders[_orderId].createdAt,
                fulfilledAt: orders[_orderId].fulfilledAt,
                terminatedAt: orders[_orderId].terminatedAt,
                lastWithdrawal: orders[_orderId].lastWithdrawal,
                balance: orders[_orderId].balance,
                setupMetadata: orders[_orderId].setupMetadata,
                deploymentMetadata: orders[_orderId].deploymentMetadata,
                offer: offers[orders[_orderId].offerId]
            });
    }

    /// @inheritdoc IMarketplace
    function getClientOrders(
        address _user
    ) external view returns (OrderWithOffer[] memory) {
        uint256[] memory orderIds = clientOrders[_user];
        OrderWithOffer[] memory result = new OrderWithOffer[](orderIds.length);

        for (uint256 i = 0; i < orderIds.length; i++) {
            uint256 orderId = orderIds[i];
            Order memory order = orders[orderId];
            Offer memory offer = offers[order.offerId];

            result[i] = OrderWithOffer({
                id: orderId,
                client: order.client,
                offerId: order.offerId,
                createdAt: order.createdAt,
                fulfilledAt: order.fulfilledAt,
                terminatedAt: order.terminatedAt,
                lastWithdrawal: order.lastWithdrawal,
                balance: order.balance,
                setupMetadata: order.setupMetadata,
                deploymentMetadata: order.deploymentMetadata,
                offer: offer
            });
        }

        return result;
    }

    /// @inheritdoc IMarketplace
    function getVendorOrders(
        address _user
    ) external view returns (OrderWithOffer[] memory) {
        uint256[] memory orderIds = vendorOrders[_user];
        OrderWithOffer[] memory result = new OrderWithOffer[](orderIds.length);

        for (uint256 i = 0; i < orderIds.length; i++) {
            uint256 orderId = orderIds[i];
            Order memory order = orders[orderId];
            Offer memory offer = offers[order.offerId];

            result[i] = OrderWithOffer({
                id: orderId,
                client: order.client,
                offerId: order.offerId,
                createdAt: order.createdAt,
                fulfilledAt: order.fulfilledAt,
                terminatedAt: order.terminatedAt,
                lastWithdrawal: order.lastWithdrawal,
                balance: order.balance,
                setupMetadata: order.setupMetadata,
                deploymentMetadata: order.deploymentMetadata,
                offer: offer
            });
        }

        return result;
    }

    /// @notice Creates a new order
    function _createOrder(
        uint256 _offerId,
        uint256 _initialCommitment,
        string calldata _setupMetadata
    ) private returns (uint256) {
        Offer memory offer = offers[_offerId];

        uint256 orderId = orderCount;
        orders[orderId] = Order({
            client: msg.sender,
            offerId: _offerId,
            createdAt: block.timestamp,
            fulfilledAt: 0,
            terminatedAt: 0,
            lastWithdrawal: 0,
            balance: _initialCommitment * offer.pricePerMonth,
            setupMetadata: _setupMetadata,
            deploymentMetadata: ""
        });
        orderCount += 1;

        clientOrders[msg.sender].push(orderId);
        vendorOrders[offer.vendor].push(orderId);

        emit NewOrder(offer.vendor, msg.sender, orderId);

        return orderId;
    }
}
