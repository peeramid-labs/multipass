// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../libraries/LibMultipass.sol";

interface IMultipass {

    /**
     * @dev Retrieves the resolved record for a given name query.
     * @param query The name query to resolve.
     * @return A boolean indicating whether the record was found, and the resolved record.
     */
    function resolveRecord(
        LibMultipass.NameQuery memory query
    ) external view returns (bool, LibMultipass.Record memory);



    /**
     * @dev Initializes new LibMultipass.Domain and configures it's parameters
     *
     * Requirements:
     *  registrar is not zero
     *  domainName is not empty
     *  domainIndex is either zero(auto assign) or can be one of preoccupied LibMultipass.Domain names
     *  domainName does not exist yet
     *  onlyOwner
     *  referrerReward+referralDiscount cannot be larger than fee
     *  @param registrar address of registrar
     *  @param freeRegistrationsNumber number of registrations free of fee
     *  @param fee fee in base currency of network
     *  @param domainName name of LibMultipass.Domain
     *  @param referrerReward referral fee share in base currency of network
     *  @param referralDiscount referral discount in base currency of network
     *
     *  Emits an {InitializedDomain} event.
     */
    function initializeDomain(
        address registrar,
        uint256 freeRegistrationsNumber,
        uint256 fee,
        bytes32 domainName,
        uint256 referrerReward,
        uint256 referralDiscount
    ) external;

    /**
     * @dev Activates LibMultipass.Domain name
     *
     * Requirements:
     *  msg.sender is Owner
     *
     *
     *  Emits an {DomainActivated} event.
     */
    function activateDomain(bytes32 domainName) external;

    /**
     * @dev Deactivates LibMultipass.Domain name
     *
     * Deactivated LibMultipass.Domain cannot mutate names and will return zeros
     *
     * Requirements:
     *  msg.sender is Owner OR registrar
     *
     *
     *  Emits an {DomainDeactivated} event.
     */

    function deactivateDomain(bytes32 domainName) external;

    /**
     * @dev Changes registrar address
     *
     * Requirements:
     *  msg.sender is Owner
     *
     *  Emits an {DomainFeeChanged} event.
     */
    function changeFee(bytes32 domainName, uint256 fee) external;

    /**
     * @dev Changes registrar address
     *
     * Requirements:
     *  msg.sender is Owner
     *
     *  Emits an {RegistrarChangeRequested} event.
     */
    function changeRegistrar(bytes32 domainName, address newRegistrar) external;

    /**
     * @dev deletes name
     *
     * Requirements:
     *  msg.sender is Owner
     *
     *  Emits an {DomainTTLChangeRequested} event.
     */
    function deleteName(LibMultipass.NameQuery memory query) external;

    /**
     * @dev executes all pending changes to LibMultipass.Domain that fulfill TTL
     *
     * Requirements:
     *  domainName must be set
     *  referrerFeeShare+referralDiscount cannot be larger than 2^32
     *
     *
     *  Emits an {ReferralProgramChangeRequested} event.
     */
    function changeReferralProgram(
        uint256 referrerFeeShare,
        uint256 referralDiscount,
        uint256 freeRegistrations,
        bytes32 domainName
    ) external;

    /**
     * @dev registers new name under LibMultipass.Domain
     *
     * Requirements:
     *  all arguments must be set
     *  domainName must be active
     * resolveRecord for given arguments should return no LibMultipass.Record
     *
     *
     *  Emits an {registered} event.
     */
    function register(
        LibMultipass.Record memory newRecord,
        bytes32 domainName,
        bytes memory registrarSignature,
        uint256 signatureDeadline,
        LibMultipass.NameQuery memory referrer,
        bytes memory referralCode
    ) external payable;

    /**
     * @dev modifies exsisting LibMultipass.Record
     *
     * Requirements:
     * resolveRecord for given arguments should return valid LibMultipass.Record
     * LibMultipass.Domain must be active
     * newAddress and newName should be set and be unique in current LibMultipass.Domain
     *
     * @param domainName LibMultipass.Domain
     * @param newName new name
     *
     *  Emits an {Modified} event.
     */
    function modifyUserName(
        bytes32 domainName,
        LibMultipass.NameQuery memory query,
        bytes32 newName,
        bytes memory registrarSignature,
        uint256 signatureDeadline
    ) external payable;

    /**
     * @dev returns balance of this contract
     */
    function getBalance() external view returns (uint256);

    /**
     * @dev returns LibMultipass.Domain state variables
     * @param domainName name of the LibMultipass.Domain
     * @return (name,
      fee,
      freeRegistrationsNumber,
       referrerReward,
       referralDiscount,
       isActive,
       registrar,
       ttl,
        registerSize)
     */
    function getDomainState(bytes32 domainName) external view returns (LibMultipass.Domain memory);

    /**
     * @dev returns contract state variables

     * @return (s_numDomains)
     */
    function getContractState() external view returns (uint256);

    /**
     * @dev Withraws funds stored in smart contract
     *
     * Requirements:
     *  onlyOwner
     *
     *  Emits an {fundsWithdawn} event.
     */
    function withrawFunds(address to) external;

    /**
     * @dev returns price for modifying name
     *
     * @return price
     */
    function getModifyPrice(LibMultipass.NameQuery memory query) external view returns (uint256);

    /**
     * @dev returns price for registering name
     *
     */
    event fundsWithdawn(uint256 indexed amount, address indexed account);

    /**
     * @dev Initializes a new domain with the specified parameters.
     * @param registrar The address of the registrar for the domain.
     * @param freeRegistrationsNumber The number of free registrations allowed for the domain.
     * @param fee The fee required for registration in the domain.
     * @param domainName The name of the domain.
     * @param referrerReward The reward for referring new registrations to the domain.
     * @param referralDiscount The discount for referrals in the domain.
     */
    event InitializedDomain(
        address indexed registrar,
        uint256 freeRegistrationsNumber,
        uint256 indexed fee,
        bytes32 indexed domainName,
        uint256 referrerReward,
        uint256 referralDiscount
    );

    /**
     * @dev Emitted when a domain is activated.
     * @param domainName The name of the activated domain.
     */
    event DomainActivated(bytes32 indexed domainName);

    /**
     * @dev Emitted when a domain is deactivated.
     * @param domainName The name of the deactivated domain.
     */
    event DomainDeactivated(bytes32 indexed domainName);

    /**
     * @dev Emitted when the fee for a domain is changed.
     * @param domainName The name of the domain.
     * @param newFee The new fee for the domain.
     */
    event DomainFeeChanged(bytes32 indexed domainName, uint256 indexed newFee);

    /**
     * @dev Emitted when the number of free registrations for a domain is changed.
     * @param domainIndex The index of the domain.
     * @param newAmount The new number of free registrations for the domain.
     */
    event FreeRegistrationsChanged(uint256 indexed domainIndex, uint256 indexed newAmount);

    /**
     * @dev Emitted when a registrar change is requested for a domain.
     * @param domainName The name of the domain.
     * @param registrar The address of the new registrar.
     */
    event RegistrarChangeRequested(bytes32 indexed domainName, address indexed registrar);

    /**
     * @dev Emitted when a domain name change is requested.
     * @param domainIndex The index of the domain.
     * @param newDomainName The new name for the domain.
     */
    event DomainNameChangeRequested(uint256 indexed domainIndex, bytes32 indexed newDomainName);

    /**
     * @dev Emitted when a name is deleted.
     * @param domainName The domain name.
     * @param wallet The address of the wallet.
     * @param id The ID of the name.
     * @param name The name.
     */
    event nameDeleted(bytes32 indexed domainName, address indexed wallet, bytes32 indexed id, bytes32 name);

    /**
     * @dev Emitted when a domain's TTL (Time-to-Live) change is requested.
     * @param domainName The domain name.
     * @param amount The new TTL amount.
     */
    event DomainTTLChangeRequested(bytes32 indexed domainName, uint256 amount);

    /**
     * @dev Emitted when the referral program for a domain is changed.
     * @param domainName The domain name.
     * @param reward The referral reward amount.
     * @param discount The referral discount amount.
     * @param freeNumber The number of free referrals.
     */
    event ReferralProgramChanged(
        bytes32 indexed domainName,
        uint256 reward,
        uint256 discount,
        uint256 indexed freeNumber
    );

    /**
     * @dev Emitted when domain changes are live.
     * @param domainName The domain name.
     * @param changes The array of changes.
     */
    event DomainChangesAreLive(bytes32 indexed domainName, bytes32[] indexed changes);

    /**
     * @dev Emitted when a changes queue is canceled.
     * @param domainName The domain name.
     * @param changes The array of changes.
     */
    event changesQeueCanceled(bytes32 indexed domainName, bytes32[] indexed changes);

    /**
     * @dev Emitted when a domain is registered.
     * @param domainName The domain name.
     * @param NewRecord The new record.
     */
    event Registered(bytes32 indexed domainName, LibMultipass.Record NewRecord);

    /**
     * @dev Emitted when a user is referred.
     * @param refferrer The record of the referrer.
     * @param newRecord The new record.
     * @param domainName The domain name.
     */
    event Referred(LibMultipass.Record refferrer, LibMultipass.Record newRecord, bytes32 indexed domainName);

    /**
     * @dev Emitted when a user record is modified.
     * @param newRecord The new record.
     * @param oldName The old name.
     * @param domainName The domain name.
     */
    event UserRecordModified(
        LibMultipass.Record indexed newRecord,
        bytes32 indexed oldName,
        bytes32 indexed domainName
    );

    /**
     * @dev Retrieves the domain state by its ID.
     * @param id The ID of the domain.
     * @return The domain state as a `LibMultipass.Domain` struct.
     */
    function getDomainStateById(uint256 id) external view returns (LibMultipass.Domain memory);
}