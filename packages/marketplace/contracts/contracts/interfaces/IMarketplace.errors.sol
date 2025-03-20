// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

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

    /// @notice Thrown when an offer run out of units
    error NoRemainingUnits();

    /// @notice Thrown when attempting to fulfill an order that has expired
    error FulfillmentPeriodExpired();

    /// @notice Thrown when an order is not verified
    error OrderNotVerified();
}
