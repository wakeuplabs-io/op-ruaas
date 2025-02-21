// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./interfaces/IMarketplace.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

contract Marketplace is IMarketplace, Initializable {
    IERC20 public paymentToken;
    mapping(address => uint256) public deposits;

    uint256 public offerCount;
    mapping(uint256 => Offer) public offers;

    uint256 public orderCount;
    mapping(uint256 => Order) public orders;
    mapping(address => uint256[]) private userOrders;

    /// @notice Only vendor
    modifier onlyVendor(uint256 _offerId) {
        if (offers[_offerId].vendor != msg.sender) {
            revert Unauthorized("Only vendor");
        }
        _;
    }

    /// @notice Only vendor or client
    modifier onlyVendorOrClient(uint256 _orderId) {
        Order memory order = orders[_orderId];
        Offer memory offer = offers[order.offerId];

        if (order.client != msg.sender || offer.vendor != msg.sender) {
            revert Unauthorized("Only vendor or client");
        }
        _;
    }

    /// @inheritdoc IMarketplace
    function initialize(IERC20 _paymentToken) public initializer {
        paymentToken = _paymentToken;
    }

    /// @inheritdoc IMarketplace
    function createOffer(
        uint256 _pricePerHour,
        uint256 _deploymentFee,
        uint256 _units
    ) public returns (uint256) {
        uint256 offerId = offerCount;
        offers[offerId] = Offer({
            vendor: msg.sender,
            pricePerHour: _pricePerHour,
            remainingUnits: _units,
            deploymentFee: _deploymentFee
        });
        offerCount += 1;

        emit NewOffer(msg.sender, offerId, _pricePerHour, _deploymentFee, _units);

        return offerId;
    }

    /// @inheritdoc IMarketplace
    function setOfferRemainingUnits(
        uint256 _offerId,
        uint256 _remainingUnits
    ) public onlyVendor(_offerId) {
        offers[_offerId].remainingUnits = _remainingUnits;
    }

    /// @inheritdoc IMarketplace
    function createOrder(
        uint256 _offerId,
        string calldata _metadata
    ) public returns (uint256) {
        Offer memory offer = offers[_offerId];

        if (offer.remainingUnits == 0) {
            revert OfferNotFound(_offerId);
        }
        offer.remainingUnits -= 1;

        uint256 orderId = offerCount + 1;
        orderCount += 1;
        orders[orderId] = Order({
            client: msg.sender,
            offerId: _offerId,
            createdAt: block.timestamp,
            fulfilledAt: 0,
            terminatedAt: 0,
            lastWithdrawal: 0,
            chainMetadata: _metadata,
            deploymentMetadata: _metadata
        });

        // can be refunded if not fulfilled
        deposits[msg.sender] -= offer.deploymentFee;
        deposits[offer.vendor] += offer.deploymentFee;

        userOrders[msg.sender].push(orderId);
        userOrders[offer.vendor].push(orderId);

        emit NewOrder(offer.vendor, msg.sender, orderId);
        return orderId;
    }

    /// @inheritdoc IMarketplace
    function fulfillOrder(
        uint256 _offerId,
        string calldata _metadata
    ) public onlyVendor(_offerId) {
        orders[_offerId].fulfilledAt = block.timestamp;
        orders[_offerId].deploymentMetadata = _metadata;

        emit OrderFulfilled(
            offers[_offerId].vendor,
            orders[_offerId].client,
            _offerId
        );
    }

    /// @inheritdoc IMarketplace
    function terminateOrder(
        uint256 _orderId
    ) public onlyVendorOrClient(_orderId) {
        Order memory order = orders[_orderId];
        order.terminatedAt = block.timestamp;

        emit OrderTerminated(
            offers[order.offerId].vendor,
            order.client,
            _orderId
        );
    }

    /// @inheritdoc IMarketplace
    function deposit(uint256 _amount) public {
        deposits[msg.sender] += _amount;

        paymentToken.transferFrom(msg.sender, address(this), _amount);

        emit Deposit(msg.sender, _amount);
    }

    /// @inheritdoc IMarketplace
    function withdraw(uint256 _amount) public {
        uint256 totalEligible = deposits[msg.sender];

        // iterate over all orders that involve this user as client or vendor
        for (uint256 i = 0; i < userOrders[msg.sender].length; i++) {
            Order memory order = orders[userOrders[msg.sender][i]];
            Offer memory offer = offers[order.offerId];

            if (
                order.lastWithdrawal > order.terminatedAt ||
                order.fulfilledAt == 0
            ) {
                // order already terminated and all withdrawals done or not fulfilled
                continue;
            }

            uint256 elapsedTime = block.timestamp -
                (
                    order.lastWithdrawal == 0
                        ? order.fulfilledAt
                        : order.lastWithdrawal
                );
            uint256 elapsedPayment = elapsedTime * offer.pricePerHour;

            if (order.client == msg.sender) {
                totalEligible -= elapsedPayment;
                deposits[offer.vendor] += elapsedPayment;
            } else {
                totalEligible += elapsedPayment;
                deposits[order.client] -= elapsedPayment;
            }

            order.lastWithdrawal = block.timestamp;
        }

        uint256 withdrawAmount = _amount == 0 ? totalEligible : _amount;
        deposits[msg.sender] = totalEligible - withdrawAmount;

        paymentToken.transfer(msg.sender, withdrawAmount);

        emit Withdrawal(msg.sender, withdrawAmount);
    }

    /// @inheritdoc IMarketplace
    function balanceOf(address _address) public view returns (uint256) {
        uint256 totalEligible = deposits[_address];

        // iterate over all orders that involve this user as client or vendor
        for (uint256 i = 0; i < userOrders[_address].length; i++) {
            Order memory order = orders[userOrders[_address][i]];
            Offer memory offer = offers[order.offerId];

            if (
                order.lastWithdrawal > order.terminatedAt ||
                order.fulfilledAt == 0
            ) {
                // order already terminated and all withdrawals done or not fulfilled
                continue;
            }

            uint256 elapsedTime = block.timestamp -
                (
                    order.lastWithdrawal == 0
                        ? order.fulfilledAt
                        : order.lastWithdrawal
                );
            uint256 elapsedPayment = elapsedTime * offer.pricePerHour;

            if (order.client == msg.sender) {
                totalEligible -= elapsedPayment;
            } else {
                totalEligible += elapsedPayment;
            }
        }

        return totalEligible;
    }
}
