// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;


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
