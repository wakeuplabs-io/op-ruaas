pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IMarketplaceErrors {
    error Unauthorized(string message);
    error InsufficientBalance(address user, uint256 amount);
    error OfferNotFound(uint256 offerId);
    error OrderNotFound(uint256 orderId);
}

interface IMarketplaceEvents {
    event Withdrawal(address user, uint256 amount);
    event Deposit(address user, uint256 amount);
    event NewOffer(address vendor, uint256 offerId, uint256 pricePerHour, uint256 deploymentFee, uint256 units);
    event NewOrder(address vendor, address client, uint256 offerId);
    event OrderFulfilled(address vendor, address client, uint256 offerId);
    event OrderTerminated(address vendor, address client, uint256 offerId);
    event OrderPaused(address vendor, address client, uint256 offerId);
}

interface IMarketplaceStructs {
    struct Offer {
        address vendor;
        uint256 pricePerHour;
        uint256 deploymentFee; 
        uint256 remainingUnits;
    }

    struct Order {
        address client;
        uint256 offerId;

        // timestamps for payment computation
        uint256 createdAt;
        uint256 fulfilledAt;
        uint256 terminatedAt;
        uint256 lastWithdrawal;

        // deployment metadata
        string chainMetadata; // metadata for deployment, link to download assets like genesis.json, etc
        string deploymentMetadata; // metadata for deployment, urls
    }
}

interface IMarketplace is IMarketplaceStructs, IMarketplaceErrors, IMarketplaceEvents {
    /// @notice Initializes the marketplace
    function initialize(
        IERC20 _paymentToken
    ) external;

    /// @notice Vendor creates an offering
    function createOffer(
        uint256 _pricePerHour,
        uint256 _deploymentFee,
        uint256 _units
    ) external returns (uint256);

    /// @notice Updates the units of an offer
    /// @dev Can also be used to delete an offer by setting limit to 0
    function setOfferRemainingUnits(
        uint256 _offerId,
        uint256 _remainingUnits
    ) external;

    /// @notice Creates an order from an offerId
    /// @dev User must have at least funds for minimum commitment.
    /// @dev Vendor must have funds for potential fee
    function createOrder(
        uint256 _offerId,
        string calldata _metadata
    ) external returns (uint256);

    /// @notice Fulfils an order. Vendor submits endpoints and starts the service.
    /// @dev There's a deadline here. It should revert if time is over
    function fulfillOrder(
        uint256 _offerId,
        string calldata _metadata
    ) external;

    /// @notice Terminates an order
    function terminateOrder(uint256 _orderId) external;

    /// @notice Deposits funds into the marketplace
    function deposit(uint256 _amount) external;

    /// @notice Withdraws funds from the marketplace
    /// @dev If amount is 0, takes maximum available
    function withdraw(uint256 _amount) external;

    /// @notice Returns the balance of an address. 
    /// @dev Computes available balance based on orders
    function balanceOf(address _address) external view returns (uint256);
}
