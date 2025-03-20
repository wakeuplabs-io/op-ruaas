// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;


interface IMarketplaceEvents {
    /// @notice Emitted when a withdrawal is made
    /// @param user The user that made the withdrawal
    /// @param orderId The order ID from which the withdrawal was made
    /// @param amount The amount withdrawn
    event Withdrawal(
        address indexed user,
        uint256 indexed orderId,
        uint256 amount
    );

    /// @notice Emitted when a deposit is made
    /// @param orderId The order ID to which the deposit was made
    /// @param amount The amount deposited
    event Deposit(uint256 indexed orderId, uint256 amount);

    /// @notice Emitted when a new offer is created by a vendor
    /// @param vendor The address of the vendor creating the offer
    /// @param offerId The unique ID of the offer
    /// @param pricePerMonth The price per month for the offer
    /// @param units The number of available units in the offer
    event NewOffer(
        address indexed vendor,
        uint256 indexed offerId,
        uint256 pricePerMonth,
        uint256 units
    );

    /// @notice Emitted when a new order is placed by a client
    /// @param vendor The address of the vendor fulfilling the order
    /// @param client The address of the client placing the order
    /// @param orderId The order ID created
    event NewOrder(
        address indexed vendor,
        address indexed client,
        uint256 indexed orderId
    );

    /// @notice Emitted when an order is fulfilled by the vendor
    /// @param vendor The address of the vendor fulfilling the order
    /// @param client The address of the client receiving the fulfillment
    /// @param orderId The unique ID of the fulfilled order
    event OrderFulfilled(
        address indexed vendor,
        address indexed client,
        uint256 indexed orderId
    );

    /// @notice Emitted when an order is terminated
    /// @param vendor The address of the vendor associated with the order
    /// @param client The address of the client associated with the order
    /// @param orderId The unique ID of the terminated order
    event OrderTerminated(
        address indexed vendor,
        address indexed client,
        uint256 indexed orderId
    );

    /// @notice Emitted when an order is verified
    /// @param vendor The address of the vendor associated with the order
    /// @param client The address of the client associated with the order
    /// @param orderId The unique ID of the verified order
    event OrderVerifier(
        address indexed vendor,
        address indexed client,
        uint256 indexed orderId
    );
}
