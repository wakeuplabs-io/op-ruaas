// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// TODO: review this file, should we split it up into multiple files?
// check other projects for examples

/// @title Marketplace Errors Interface
/// @notice Defines common errors used in the Marketplace contract
interface IMarketplaceErrors {
    /// @notice Thrown when an unauthorized action is attempted
    /// @param message A descriptive message explaining the reason for failure
    error Unauthorized(string message);

    /// @notice Thrown when a user does not have enough balance for an operation
    /// @param user The address of the user attempting the operation
    /// @param amount The required amount that the user does not have
    error InsufficientBalance(address user, uint256 amount);

    /// @notice Thrown when an operation is attempted on an order that has already been terminated
    error OrderAlreadyTerminated();

    /// @notice Thrown when an operation requires an order to be fulfilled but it is not
    error OrderNotFulfilled();

    /// @notice Thrown when an operation requires an order to be fulfilled but it has already been fulfilled
    error OrderAlreadyFulfilled();

    /// @notice Thrown when an offer with the given ID does not exist
    error OfferNotFound();

    /// @notice Thrown when attempting to fulfill an order that has expired
    error FulfillmentPeriodExpired();

    /// @notice Thrown when an order is not verified
    error OrderNotVerified();
}

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

interface IMarketplaceStructs {
    /// @title Offer Struct
    /// @notice Represents an offer created by a vendor for clients to purchase
    struct Offer {
        /// @notice The address of the vendor who created the offer
        address vendor;
        /// @notice The cost per hour for using the service
        uint256 pricePerMonth;
        /// @notice The number of units remaining for this offer
        uint256 remainingUnits;
        /// @notice Metadata about the vendor and the offer
        string metadata;
    }

    /// @title Order Struct
    /// @notice Represents an order placed by a client for a specific offer
    struct Order {
        /// @notice The address of the client who placed the order
        address client;
        /// @notice The ID of the offer associated with this order
        uint256 offerId;
        /// @notice The current balance allocated for this order
        uint256 balance;
        /// @notice The timestamp when the order was created
        uint256 createdAt;
        /// @notice The timestamp when the order was fulfilled by the vendor
        uint256 fulfilledAt;
        /// @notice The timestamp when the order was terminated
        uint256 terminatedAt;
        /// @notice The timestamp of the last withdrawal made from this order by the vendor
        uint256 lastWithdrawal;
        /// @notice SetupMetadata user specifications for his chain
        string setupMetadata;
        /// @notice deploymentMetadata related to the order, such as contract addresses and endpoints
        string deploymentMetadata;
    }

    /// @title Order With Offer Struct
    /// @notice Represents an order placed by a client, including the offer details
    struct OrderWithOffer {
        /// @notice The ID of the order
        uint256 id;
        /// @notice The address of the client who placed the order
        address client;
        /// @notice The ID of the offer associated with this order
        uint256 offerId;
        /// @notice The timestamp when the order was created
        uint256 createdAt;
        /// @notice The timestamp when the order was fulfilled by the vendor (0 if not fulfilled)
        uint256 fulfilledAt;
        /// @notice The timestamp when the order was terminated (0 if not terminated)
        uint256 terminatedAt;
        /// @notice The timestamp of the last withdrawal made from this order by the vendor
        uint256 lastWithdrawal;
        /// @notice The current balance allocated for this order
        uint256 balance;
        /// @notice Metadata provided by the client at the time of order creation
        string setupMetadata;
        /// @notice Metadata related to the order fulfillment, such as contract addresses and endpoints
        string deploymentMetadata;
        /// @notice The offer details associated with this order
        Offer offer;
    }
}

interface IMarketplace is
    IMarketplaceStructs,
    IMarketplaceErrors,
    IMarketplaceEvents
{
    /// @notice Vendor creates an offering
    function createOffer(
        uint256 _pricePerMonth,
        uint256 _units,
        string calldata _metadata
    ) external returns (uint256);

    /// @notice Updates the units of an offer
    /// @dev Can also be used to delete an offer by setting limit to 0
    function setOfferRemainingUnits(
        uint256 _offerId,
        uint256 _remainingUnits
    ) external;

    /// @notice Creates an order from an offerId
    /// @dev User commits initial deposit
    /// @param _offerId The ID of the offer to purchase
    /// @param _initialCommitment The number of months to commit
    /// @param _setupMetadata user specifications for the chain
    function createOrder(
        uint256 _offerId,
        uint256 _initialCommitment,
        string calldata _setupMetadata
    ) external returns (uint256);

    /// @notice Fulfils an order. Vendor submits endpoints and starts the service.
    /// @dev There's a deadline here. It should revert if time is over
    /// @param _offerId The ID of the offer to purchase
    /// @param _deploymentMetadata deployment outputs and relevant information
    function fulfillOrder(
        uint256 _offerId,
        string calldata _deploymentMetadata
    ) external;

    /// @notice Terminates an order
    function terminateOrder(uint256 _orderId) external;

    /// @notice Deposits funds into the marketplace
    function deposit(uint256 _orderId, uint256 _amount) external;

    /// @notice Withdraws from order vault, maximum if amount is 0
    function withdraw(uint256 _orderId, uint256 _amount) external;

    /// @notice Returns the remaining balance of the order, computing at the moment
    function balanceOf(
        address _address,
        uint256 _orderId
    ) external view returns (uint256);

    /// @notice Returns an order Detail
    function getOrder(
        uint256 _orderId
    ) external view returns (OrderWithOffer memory);

    /// @notice Returns the list of orders where the given address is the client.
    function getClientOrders(
        address _user
    ) external view returns (OrderWithOffer[] memory);

    /// @notice Returns the list of orders where the given address is the vendor.
    function getVendorOrders(
        address _user
    ) external view returns (uint256[] memory);
}
