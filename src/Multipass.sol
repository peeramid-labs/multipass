// SPDX-License-Identifier: MIT
pragma solidity =0.8.28;
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import "./interfaces/IMultipass.sol";
import "./libraries/LibMultipass.sol";
/**
 * @title Multipass
 * @dev This contract implements various functions related to the management of domain names and registration records.
 * @custom:security-contact sirt@peeramid.xyz
 */
contract Multipass is ERC165Upgradeable, EIP712Upgradeable, IMultipass, ReentrancyGuardUpgradeable, OwnableUpgradeable {
    using ECDSA for bytes32;
    using LibMultipass for bytes32;

    // using LibMultipass for LibMultipass.Record;
    using LibMultipass for LibMultipass.Record;
    using LibMultipass for bytes;

    constructor() {
        _disableInitializers();
    }
    /**
     * @notice Initializes the contract with a name, version, and owner address.
     * This function can only be called once due to the `initializer` modifier.
     * @param name The name to initialize the contract with.
     * @param version The version to initialize the contract with.
     * @param owner The address of the owner of the contract.
     */
    function initialize(string memory name, string memory version, address owner) external initializer {
        __Ownable_init(owner);
        __EIP712_init(name, version);
    }

    function _isValidSignature(
        bytes memory message,
        bytes memory signature,
        address account
    ) internal view returns (bool) {
        bytes32 typedHash = _hashTypedDataV4(keccak256(message));
        return SignatureChecker.isValidSignatureNow(account, typedHash, signature);
    }

    function _validateRecord(LibMultipass.Record memory newRecord, bytes memory registrarSignature) private view {
        LibMultipass.NameQuery memory query = LibMultipass.queryFromRecord(newRecord);
        //Check name query is legit
        require(LibMultipass._checkNotEmpty(query.id), invalidQuery(InvalidQueryReasons.EMPTY_ID));
        require(LibMultipass._checkNotEmpty(query.domainName), invalidQuery(InvalidQueryReasons.EMPTY_DOMAIN));
        require(query.wallet != address(0), invalidQuery(InvalidQueryReasons.EMPTY_ADDRESS));
        //Check LibMultipass.Domain is legit
        LibMultipass.DomainStorage storage _domain = LibMultipass._getDomainStorage(query.domainName);
        require(_domain.properties.isActive, isActive(_domain.properties.name, false));

        //check signatures and time
        require(newRecord.validUntil > block.timestamp, signatureExpired(newRecord.validUntil));

        {
            bytes memory registrarMessage = abi.encode(
                LibMultipass._TYPEHASH,
                newRecord.name,
                newRecord.id,
                newRecord.domainName,
                newRecord.validUntil,
                newRecord.nonce
            );

            require(
                _isValidSignature(registrarMessage, registrarSignature, _domain.properties.registrar),
                invalidSignature()
            );
        }
    }

    /// @inheritdoc IMultipass
    function initializeDomain(
        address registrar,
        uint256 fee,
        uint256 renewalFee,
        bytes32 domainName,
        uint256 referrerReward,
        uint256 referralDiscount
    ) public override onlyOwner {
        require(registrar != address(0), invalidRegistrar(registrar));
        require(LibMultipass._checkNotEmpty(domainName), invalidQuery(InvalidQueryReasons.EMPTY_DOMAIN));
        require(LibMultipass.resolveDomainIndex(domainName) == 0, nameExists(domainName));
        (bool status, uint256 result) = Math.tryAdd(referrerReward, referralDiscount);
        require(status, mathOverflow(referrerReward, referralDiscount));
        require(result <= fee, referralRewardsTooHigh(referrerReward, referralDiscount, fee));

        LibMultipass._initializeDomain(registrar, fee, renewalFee, domainName, referrerReward, referralDiscount);
        emit InitializedDomain(registrar, fee, domainName, renewalFee, referrerReward, referralDiscount);
    }

    function _enforseDomainNameIsValid(bytes32 domainName) private view {
        require(domainName._checkNotEmpty(), invalidDomain(domainName));
        require(domainName.resolveDomainIndex() != 0, invalidDomain(domainName));
    }

    /// @inheritdoc IMultipass
    function activateDomain(bytes32 domainName) external override onlyOwner {
        _enforseDomainNameIsValid(domainName);
        LibMultipass.DomainStorage storage _domain = LibMultipass._getDomainStorage(domainName);
        _domain.properties.isActive = true;
        emit DomainActivated(domainName);
    }

    /// @inheritdoc IMultipass
    function deactivateDomain(bytes32 domainName) public override onlyOwner {
        _enforseDomainNameIsValid(domainName);
        LibMultipass.DomainStorage storage _domain = LibMultipass._getDomainStorage(domainName);
        _domain.properties.isActive = false;
        emit DomainDeactivated(domainName);
    }

    /// @inheritdoc IMultipass
    function changeFee(bytes32 domainName, uint256 fee) public override onlyOwner {
        _enforseDomainNameIsValid(domainName);
        LibMultipass.DomainStorage storage _domain = LibMultipass._getDomainStorage(domainName);
        uint256 _referrerReward = _domain.properties.referrerReward;
        uint256 _referralDiscount = _domain.properties.referralDiscount;
        require(
            _referralDiscount + _referrerReward <= fee,
            referralRewardsTooHigh(_referrerReward, _referralDiscount, fee)
        );
        _domain.properties.fee = fee;
        emit DomainFeeChanged(domainName, fee);
    }

    /// @inheritdoc IMultipass
    function changeRegistrar(bytes32 domainName, address newRegistrar) external override onlyOwner {
        _enforseDomainNameIsValid(domainName);
        LibMultipass.DomainStorage storage _domain = LibMultipass._getDomainStorage(domainName);
        require(newRegistrar != address(0), invalidRegistrar(newRegistrar));
        _domain.properties.registrar = newRegistrar;
        emit RegistrarChanged(domainName, newRegistrar);
    }

    /// @inheritdoc IMultipass
    function deleteName(
        LibMultipass.NameQuery memory query // bytes32 domainName, // address wallet, // bytes32 username, // bytes32 id
    ) external override onlyOwner {
        _enforseDomainNameIsValid(query.domainName);
        LibMultipass.DomainStorage storage _domain = LibMultipass._getDomainStorage(query.domainName);
        query.targetDomain = "";
        (bool status, LibMultipass.Record memory r) = resolveRecord(query);
        require(status, userNotFound(query));
        _domain.addressToId[r.wallet] = bytes32(0);
        _domain.idToAddress[r.id] = address(0);
        _domain.idToName[r.id] = bytes32(0);
        _domain.nameToId[r.name] = bytes32(0);
        _domain.validUntil[r.wallet] = 0;
        _domain.nonce[r.id] += 1;
        _domain.properties.registerSize--;

        emit nameDeleted(_domain.properties.name, r.wallet, r.id, r.name);
    }

    /// @inheritdoc IMultipass
    function changeReferralProgram(
        uint256 referrerReward,
        uint256 referralDiscount,
        bytes32 domainName
    ) external override onlyOwner {
        _enforseDomainNameIsValid(domainName);
        LibMultipass.DomainStorage storage _domain = LibMultipass._getDomainStorage(domainName);
        (bool status, uint256 result) = Math.tryAdd(referrerReward, referralDiscount);
        require(status, mathOverflow(referrerReward, referralDiscount));
        require(
            result <= _domain.properties.fee,
            referralRewardsTooHigh(referrerReward, referralDiscount, _domain.properties.fee)
        );
        _domain.properties.referrerReward = referrerReward;
        _domain.properties.referralDiscount = referralDiscount;
        emit ReferralProgramChanged(domainName, referrerReward, referralDiscount);
    }

    /// @inheritdoc IMultipass
    function resolveRecord(
        LibMultipass.NameQuery memory query
    ) public view override returns (bool, LibMultipass.Record memory) {
        return LibMultipass.resolveRecord(query);
    }

    /// @inheritdoc IMultipass
    function register(
        LibMultipass.Record memory newRecord,
        bytes memory registrarSignature,
        LibMultipass.NameQuery memory referrer,
        bytes memory referralCode
    ) external payable override nonReentrant {
        _enforseDomainNameIsValid(newRecord.domainName);
        //Check query does not resolves (name already exists)

        {
            LibMultipass.NameQuery memory query = LibMultipass.queryFromRecord(newRecord);
            {
                (bool success, LibMultipass.Record memory r) = LibMultipass.resolveRecord(query);
                require(!success, recordExists(r));
            }
            {
                query.wallet = address(0);
                (bool success, LibMultipass.Record memory r) = LibMultipass.resolveRecord(query);
                require(!success, recordExists(r));
            }
            {
                query.id = bytes32(0);
                (bool success, LibMultipass.Record memory r) = LibMultipass.resolveRecord(query);
                require(!success, recordExists(r));
            }
        }
        _validateRecord(newRecord, registrarSignature);
        LibMultipass.DomainStorage storage _domain = LibMultipass._getDomainStorage(newRecord.domainName);
        (bool hasValidReferrer, LibMultipass.Record memory referrerRecord) = LibMultipass.resolveRecord(referrer);

        uint256 referrersShare = hasValidReferrer ? _domain.properties.referrerReward : 0;
        uint256 valueToPay = _domain.properties.fee - (hasValidReferrer ? _domain.properties.referralDiscount : 0);
        require(msg.value >= valueToPay, paymentTooLow(valueToPay, msg.value));
        uint256 ownerShare = msg.value - referrersShare;
        {
            (bool success, ) = payable(owner()).call{value: ownerShare}("");
            require(success, paymendFailed());
        }

        if (hasValidReferrer) {
            require(referrerRecord.wallet != newRecord.wallet, referredSelf());
            {
                bytes memory refferalMessage = abi.encode(LibMultipass._TYPEHASH_REFERRAL, referrerRecord.wallet);
                require(_isValidSignature(refferalMessage, referralCode, referrerRecord.wallet), invalidSignature());
                (bool success, ) = payable(referrerRecord.wallet).call{value: referrersShare}("");
                require(success, paymendFailed());
            }
            emit Referred(referrerRecord, newRecord, newRecord.domainName);
        }

        LibMultipass._registerNew(newRecord, _domain);
        emit Registered(_domain.properties.name, newRecord);
    }

    /// @inheritdoc IMultipass
    function renewRecord(
        LibMultipass.NameQuery memory query,
        LibMultipass.Record memory record,
        bytes memory registrarSignature
    ) external payable override nonReentrant {
        _enforseDomainNameIsValid(record.domainName);
        (bool userExists, LibMultipass.Record memory userRecord) = LibMultipass.resolveRecord(query);
        require(userRecord.nonce < record.nonce, invalidNonceIncrement(userRecord.nonce, record.nonce));
        require(userRecord.domainName == record.domainName, invalidDomain(userRecord.domainName));
        _validateRecord(record, registrarSignature);
        require(userExists, userNotFound(query));
        LibMultipass.DomainStorage storage _domain = LibMultipass._getDomainStorage(record.domainName);
        require(_domain.properties.isActive, domainNotActive(record.domainName));
        require(record.validUntil >= block.timestamp, signatureExpired(record.validUntil));
        emit Renewed(record.wallet, record.domainName, record.id, record);
        if (_domain.properties.renewalFee > 0) {
            require(
                msg.value >= _domain.properties.renewalFee,
                paymentTooLow(_domain.properties.renewalFee, msg.value)
            );
            (bool success, ) = payable(owner()).call{value: _domain.properties.renewalFee}("");
            require(success, paymendFailed());
        }
    }

    /// @inheritdoc IMultipass
    function getDomainState(bytes32 domainName) external view override returns (LibMultipass.Domain memory) {
        LibMultipass.DomainStorage storage _domain = LibMultipass._getDomainStorage(domainName);
        return _domain.properties;
    }

    /// @inheritdoc IMultipass
    function getDomainStateById(uint256 id) external view returns (LibMultipass.Domain memory) {
        LibMultipass.DomainStorage storage _domain = LibMultipass._getDomainStorageById(id);
        return _domain.properties;
    }

    /// @inheritdoc IMultipass
    function getContractState() external view override returns (uint256) {
        return LibMultipass._getContractState();
    }

    /**
     * @dev Checks if the contract supports a given interface.
     * @param interfaceId The interface identifier, as specified in ERC-165.
     * @return bool True if the contract supports the given interface, false otherwise.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IMultipass).interfaceId || super.supportsInterface(interfaceId);
    }

    /// @inheritdoc IMultipass
    function changeRenewalFee(uint256 fee, bytes32 domainName) external onlyOwner {
        _enforseDomainNameIsValid(domainName);
        LibMultipass.DomainStorage storage _domain = LibMultipass._getDomainStorage(domainName);
        _domain.properties.renewalFee = fee;
        emit RenewalFeeChanged(domainName, fee);
    }
}
