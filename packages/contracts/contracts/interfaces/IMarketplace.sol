pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

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

    /// @notice Thrown when an offer with the given ID does not exist
    error OfferNotFound();
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
    /// @param pricePerHour The price per hour for the offer
    /// @param deploymentFee The deployment fee required for the offer
    /// @param fulfillmentTime The expected time to fulfill the order (in seconds)
    /// @param units The number of available units in the offer
    event NewOffer(
        address indexed vendor,
        uint256 indexed offerId,
        uint256 pricePerHour,
        uint256 deploymentFee,
        uint256 fulfillmentTime,
        uint256 units
    );

    /// @notice Emitted when a new order is placed by a client
    /// @param vendor The address of the vendor fulfilling the order
    /// @param client The address of the client placing the order
    /// @param offerId The offer ID associated with the order
    event NewOrder(
        address indexed vendor,
        address indexed client,
        uint256 indexed offerId
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
}

interface IMarketplaceStructs {
    /// @title Offer Struct
    /// @notice Represents an offer created by a vendor for clients to purchase
    struct Offer {
        /// @notice The address of the vendor who created the offer
        address vendor;
        /// @notice The cost per hour for using the service
        uint256 pricePerHour;
        /// @notice The one-time deployment fee required to activate the offer
        uint256 deploymentFee;
        /// @notice The number of units remaining for this offer
        uint256 remainingUnits;
        /// @notice The time (in seconds) required for fulfillment, during which withdrawals are locked
        uint256 fulfillmentTime;
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
        /// @notice Metadata related to the order, such as contract addresses and endpoints
        string metadata;
    }
}

interface IMarketplace is
    IMarketplaceStructs,
    IMarketplaceErrors,
    IMarketplaceEvents
{
    /// @notice Vendor creates an offering
    function createOffer(
        uint256 _pricePerHour,
        uint256 _deploymentFee,
        uint256 _fulfillmentTime,
        uint256 _units
    ) external returns (uint256);

    /// @notice Updates the units of an offer
    /// @dev Can also be used to delete an offer by setting limit to 0
    function setOfferRemainingUnits(
        uint256 _offerId,
        uint256 _remainingUnits
    ) external;

    /// @notice Creates an order from an offerId
    /// @dev User commits initial deposit
    function createOrder(
        uint256 _offerId,
        uint256 _initialDeposit
    ) external returns (uint256);

    /// @notice Fulfils an order. Vendor submits endpoints and starts the service.
    /// @dev There's a deadline here. It should revert if time is over
    function fulfillOrder(uint256 _offerId, string calldata _metadata) external;

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
}
