// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import { IMarketplaceStructs } from "./IMarketplace.structs.sol";
import { IMarketplaceErrors } from "./IMarketplace.errors.sol";
import { IMarketplaceEvents } from "./IMarketplace.events.sol";

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
    ) external view returns (OrderWithOffer[] memory);
}
