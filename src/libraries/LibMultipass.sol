// SPDX-License-Identifier: MIT
pragma solidity =0.8.28;
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title LibMultipass
 * @notice Library for handling multipass functionality.
 *
 * This library provides a set of functions to manage and utilize multipass features.
 * It is designed to be used as a part of the multipass system within the project.
 * @custom:security-contact sirt@peeramid.xyz
 */
library LibMultipass {
    /**
     * @dev resolves user from any given argument
     * Requirements:
     *  domainName must be given and must be initialized
     *  id OR username OR address must be given
     * This method first tries to resolve by address, then by user id and finally by username
     * @param domainName domain name
     * @param wallet adress of user
     * @param id user id
     * @param username username
     * @param targetDomain if this is set to valid domain name, then after sucessfull resolving account at domainName,
     *                       this method will rerun with resolving user properties in targetDomain
     */
    struct NameQuery {
        bytes32 domainName;
        address wallet;
        bytes32 name;
        bytes32 id;
        bytes32 targetDomain;
    }

    /**
     * @dev The domain name of the registrar.
     * @param registrar is the address private key of which is owned by signing server (e.g. Discord bot server)
     * @param name is unique string that is used to find this domain within domains.

     * @param fee amount of payment requried to register name in the domain
     * @param ttl time to live for changes in the domain properties
     * @param isActive when is false domain name will not respond to any changes and will not return any address
    **/
    struct Domain {
        bytes32 name; //32bytes
        uint256 fee; //32bytes
        uint256 referrerReward; //32bytes
        uint256 referralDiscount; //32bytes
        bool isActive; //1byte
        address registrar; //20 bytes
        uint24 ttl; //3 bytes (not being used for now)
        uint256 registerSize; //32bytes
        uint256 renewalFee; //32bytes
    }

    /**
     * @dev The record in the registry.
     * @param wallet is the address of the user
     * @param name is the name of the user
     * @param id is the unique identificator of the user
     * @param nonce is the number of changes in the user record
     * @param domainName is the domain name of the registrar
     **/
    struct Record {
        address wallet;
        bytes32 name;
        bytes32 id;
        uint96 nonce;
        bytes32 domainName;
        uint256 validUntil;
    }

    bytes32 private constant MULTIPASS_STORAGE_POSITION = bytes32(uint256(keccak256("multipass.storage.struct")) - 1);

    /**
     * @dev The domain name of the registrar.
     * @param properties - domain configuration
     * @param idToAddress is mapping from unique identificator to an address
     * @param registerSize is number of registered users for this domain
     * @param nonce is incremented each time Record changes in addressToId map
     * @param nameToId is mapping from names to unique identificator. While each name required to be unique,
                        names might change on the domain, so we keep records to user identificators as immutable property of user
     * @param addressToId is mapping from an address to unique identificator
     * @param idToName is mapping from identificator to a name
    **/
    struct DomainStorage {
        Domain properties; //128 bytes
        mapping(bytes32 => address) idToAddress; //N*20bytes
        mapping(bytes32 => uint96) nonce; //N*12bytes
        mapping(address => bytes32) addressToId; //N*32 bytes
        mapping(bytes32 => bytes32) nameToId; //N*32 bytes
        mapping(bytes32 => bytes32) idToName; //N*32 bytes
        mapping(address => uint256) validUntil; //N*32 bytes
    }

    /**
     * @dev The storage structure for the Multipass contract.
     * @param domains is mapping from domain index to domain properties
     * @param domainNameToIndex is mapping from domain name to domain index
     */
    struct MultipassStorageStruct {
        mapping(uint256 => DomainStorage) domains;
        mapping(bytes32 => uint256) domainNameToIndex; //helper to get domain index by name
        uint256 numDomains;
    }

    /**
     * @dev Returns the storage struct for the Multipass contract.
     */
    function MultipassStorage() private pure returns (MultipassStorageStruct storage es) {
        bytes32 position = MULTIPASS_STORAGE_POSITION;
        assembly {
            es.slot := position
        }
    }

    bytes32 internal constant _TYPEHASH =
        keccak256("registerName(bytes32 name,bytes32 id,bytes32 domainName,uint256 validUntil,uint96 nonce)");
    bytes32 internal constant _TYPEHASH_REFERRAL = keccak256("proofOfReferrer(address referrerAddress)");

    function _checkNotEmpty(bytes32 value) internal pure returns (bool) {
        if (value == "") {
            return false;
        } else {
            return true;
        }
    }

    /**
     * @dev Resolves the index of a domain name in the Multipass storage.
     * @param domainName The domain name to resolve the index for.
     * @return The index of the domain name in the storage.
     */
    function resolveDomainIndex(bytes32 domainName) internal view returns (uint256) {
        MultipassStorageStruct storage s = MultipassStorage();
        return s.domainNameToIndex[domainName];
    }

    function _getDomainStorage(bytes32 domainName) internal view returns (DomainStorage storage) {
        MultipassStorageStruct storage s = MultipassStorage();

        return s.domains[resolveDomainIndex(domainName)];
    }

    function _initializeDomain(
        address registrar,
        uint256 fee,
        uint256 renewalFee,
        bytes32 domainName,
        uint256 referrerReward,
        uint256 referralDiscount
    ) internal {
        LibMultipass.MultipassStorageStruct storage ms = MultipassStorage();

        uint256 domainIndex = ms.numDomains + 1;
        LibMultipass.DomainStorage storage _domain = ms.domains[domainIndex];
        _domain.properties.registrar = registrar;
        _domain.properties.fee = fee;
        _domain.properties.name = domainName;
        _domain.properties.referrerReward = referrerReward;
        _domain.properties.referralDiscount = referralDiscount;
        _domain.properties.renewalFee = renewalFee;
        ms.numDomains++;
        ms.domainNameToIndex[domainName] = domainIndex;
    }

    function _resolveRecord(NameQuery memory query) private view returns (bool, Record memory) {
        if ((query.wallet == address(0)) && (query.id == bytes32(0)) && (query.name == bytes32(0))) {
            Record memory rv;
            return (false, rv);
        }

        MultipassStorageStruct storage s = MultipassStorage();
        DomainStorage storage _domain = s.domains[s.domainNameToIndex[query.domainName]];
        DomainStorage storage _targetDomain = s.domains[
            s.domainNameToIndex[query.targetDomain == bytes32(0) ? query.domainName : query.targetDomain]
        ];
        address _wallet;
        {
            // resolve wallet
            if (query.wallet != address(0)) {
                _wallet = query.wallet;
            } else if (query.id != bytes32(0)) {
                _wallet = _domain.idToAddress[query.id];
            } else if (query.name != bytes32(0)) {
                bytes32 _id = _domain.nameToId[query.name];
                _wallet = _domain.idToAddress[_id];
            }
        }

        //from wallet find and return record
        return _resolveFromAddress(_wallet, _targetDomain);
    }

    /**
     * @dev Resolves the record of a user.
     * @param query The query to resolve the record for.
     * @return The record of the user.
     * @dev resolves Record of name query in to status and identity
     */
    function resolveRecord(NameQuery memory query) internal view returns (bool, Record memory) {
        return _resolveRecord(query);
    }

    /** @dev this function bears no security checks, it will ignore nonce in arg and will increment
     *   nonce value stored in domain instread
     */
    function _setRecord(DomainStorage storage domain, Record memory record) internal {
        domain.addressToId[record.wallet] = record.id;
        domain.idToAddress[record.id] = record.wallet;
        domain.idToName[record.id] = record.name;
        domain.nameToId[record.name] = record.id;
        domain.nonce[record.id] += 1;
        domain.validUntil[record.wallet] = record.validUntil;
    }

    function _resolveFromAddress(
        address _address,
        DomainStorage storage _domain
    ) private view returns (bool, Record memory) {
        Record memory resolved;

        resolved.id = _domain.addressToId[_address];
        resolved.name = _domain.idToName[resolved.id];
        resolved.nonce = _domain.nonce[resolved.id];
        resolved.wallet = _address;
        resolved.domainName = _domain.properties.name;
        resolved.validUntil = _domain.validUntil[_address];

        if (resolved.id == bytes32(0)) {
            return (false, resolved);
        }
        return (true, resolved);
    }
    /**
     * @dev Resolves the record of a user.
     * @param _record The record to resolve the query for.
     * @return query result.
     */
    function queryFromRecord(Record memory _record) internal pure returns (NameQuery memory) {
        NameQuery memory _query;
        _query.id = _record.id;
        _query.domainName = _record.domainName;
        _query.name = _record.name;
        _query.wallet = _record.wallet;
        return _query;
    }

    function _registerNew(Record memory newRecord, DomainStorage storage domain) internal {
        _setRecord(domain, newRecord);
        domain.properties.registerSize += 1;
    }

    function _getContractState() internal view returns (uint256) {
        LibMultipass.MultipassStorageStruct storage ms = MultipassStorage();
        return ms.numDomains;
    }

    function _getDomainStorageById(uint256 id) internal view returns (DomainStorage storage) {
        MultipassStorageStruct storage s = MultipassStorage();

        return s.domains[id];
    }

    using LibMultipass for NameQuery;
}
