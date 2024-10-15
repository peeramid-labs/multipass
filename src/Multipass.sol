// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
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
 */
contract Multipass is ERC165Upgradeable, EIP712Upgradeable, IMultipass, ReentrancyGuardUpgradeable, OwnableUpgradeable {

    using ECDSA for bytes32;
    using LibMultipass for bytes32;

    // using LibMultipass for LibMultipass.Record;
    using LibMultipass for LibMultipass.Record;
    using LibMultipass for bytes;

       function _buildDomainSeparator(
        bytes32 typeHash,
        bytes32 nameHash,
        bytes32 versionHash
    ) private view returns (bytes32) {
        return keccak256(abi.encode(typeHash, nameHash, versionHash, block.chainid, address(this)));
    }

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

    function _validateRegistration(
        LibMultipass.Record memory newRecord,
        bytes32 domainName,
        bytes memory registrarSignature,
        uint256 signatureDeadline
    ) private view {
        LibMultipass.NameQuery memory query = LibMultipass.queryFromRecord(newRecord, domainName);
        //Check name query is legit
        require(LibMultipass._checkNotEmpty(query.id), "_validateNameQuery-> new record id cannot be empty");
        require(
            LibMultipass._checkNotEmpty(query.domainName),
            "_validateNameQuery-> new record domain cannot be empty"
        );
        require(query.wallet != address(0), "_validateNameQuery-> new ecord address cannot be empty");

        //Check query does not resolves (name already exists)
        (bool nameExists, ) = LibMultipass.resolveRecord(query);
        require(!nameExists, "User already registered, use modify instead");
        //Check LibMultipass.Domain is legit
        LibMultipass.DomainStorage storage _domain = LibMultipass._getDomainStorage(query.domainName);
        require(_domain.properties.isActive, "Multipass->register: domain is not active");

        //check signatures and time
        require(signatureDeadline > block.number, "Multipass->register: Deadline is less than current block number");

        {
            bytes memory registrarMessage = abi.encode(
                LibMultipass._TYPEHASH,
                query.name,
                query.id,
                query.domainName,
                signatureDeadline,
                0
            );

            require(
                _isValidSignature(registrarMessage, registrarSignature, _domain.properties.registrar),
                "Multipass->register: Registrar signature is not valid"
            );
        }
        {
            (bool status, ) = LibMultipass.resolveRecord(query);
            require(!status, "Multipass->register: applicant is already registered, use modify instread");
        }
    }

    /// @inheritdoc IMultipass
    function initializeDomain(
        address registrar,
        uint256 freeRegistrationsNumber,
        uint256 fee,
        bytes32 domainName,
        uint256 referrerReward,
        uint256 referralDiscount
    ) public override onlyOwner {
        require(registrar != address(0), "Multipass->initializeDomain: You must provide a registrar address");
        require(LibMultipass._checkNotEmpty(domainName), "Multipass->initializeDomain: Domain name cannot be empty");
        require(
            LibMultipass.resolveDomainIndex(domainName) == 0,
            "Multipass->initializeDomain: Domain name already exists"
        );
        (bool status, uint256 result) = Math.tryAdd(referrerReward, referralDiscount);
        require(status, "Multipass->initializeDomain: referrerReward + referralDiscount overflow");
        require(result <= fee, "Multipass->initializeDomain: referral values are higher then fee itself");

        LibMultipass._initializeDomain(
            registrar,
            freeRegistrationsNumber,
            fee,
            domainName,
            referrerReward,
            referralDiscount
        );
        emit InitializedDomain(registrar, freeRegistrationsNumber, fee, domainName, referrerReward, referralDiscount);
    }

    function _enforseDomainNameIsValid(bytes32 domainName) private view {
        require(domainName._checkNotEmpty(), "activateDomain->Please specify LibMultipass.Domain name");
        require(domainName.resolveDomainIndex() != 0, "Domain does not exist");
    }

    /// @inheritdoc IMultipass
    function activateDomain(bytes32 domainName) public override onlyOwner {
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
    }

    /// @inheritdoc IMultipass
    function changeFee(bytes32 domainName, uint256 fee) public override onlyOwner {
        _enforseDomainNameIsValid(domainName);
        LibMultipass.DomainStorage storage _domain = LibMultipass._getDomainStorage(domainName);
        uint256 _referrerReward = _domain.properties.referrerReward;
        uint256 _referralDiscount = _domain.properties.referralDiscount;
        require(
            _referralDiscount + _referrerReward <= fee,
            "Multipass->changeFee: referral rewards would become too high"
        );
        _domain.properties.fee = fee;
        emit DomainFeeChanged(domainName, fee);
    }

    /// @inheritdoc IMultipass
    function changeRegistrar(bytes32 domainName, address newRegistrar) public override onlyOwner {
        _enforseDomainNameIsValid(domainName);
        LibMultipass.DomainStorage storage _domain = LibMultipass._getDomainStorage(domainName);
        require(newRegistrar != address(0), "new registrar cannot be zero");
        _domain.properties.registrar = newRegistrar;
    }

    /// @inheritdoc IMultipass
    function deleteName(
        LibMultipass.NameQuery memory query // bytes32 domainName, // address wallet, // bytes32 username, // bytes32 id
    ) public override onlyOwner {
        _enforseDomainNameIsValid(query.domainName);
        LibMultipass.DomainStorage storage _domain = LibMultipass._getDomainStorage(query.domainName);
        query.targetDomain = "";
        (bool status, LibMultipass.Record memory r) = resolveRecord(query);
        require(status, "Multipass->deleteName: name not resolved");
        _domain.addressToId[r.wallet] = bytes32(0);
        _domain.idToAddress[r.id] = address(0);
        _domain.idToName[r.id] = bytes32(0);
        _domain.nameToId[r.name] = bytes32(0);
        _domain.nonce[r.id] += 1;
        _domain.properties.registerSize--;

        emit nameDeleted(_domain.properties.name, r.wallet, r.id, r.name);
    }

    /// @inheritdoc IMultipass
    function changeReferralProgram(
        uint256 referrerReward,
        uint256 freeRegistrations,
        uint256 referralDiscount,
        bytes32 domainName
    ) public override onlyOwner {
        _enforseDomainNameIsValid(domainName);
        LibMultipass.DomainStorage storage _domain = LibMultipass._getDomainStorage(domainName);
        (bool status, uint256 result) = Math.tryAdd(referrerReward, referralDiscount);
        require(status, "Multipass->changeReferralProgram: referrerReward + referralDiscount overflow");
        require(
            result <= _domain.properties.fee,
            "Multipass->changeReferralProgram: referral values are higher then the fee itself"
        );
        _domain.properties.referrerReward = referrerReward;
        _domain.properties.referralDiscount = referralDiscount;
        _domain.properties.freeRegistrationsNumber = freeRegistrations;
        emit ReferralProgramChanged(domainName, referrerReward, referralDiscount, freeRegistrations);
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
        bytes32 domainName,
        bytes memory registrarSignature,
        uint256 signatureDeadline,
        LibMultipass.NameQuery memory referrer,
        bytes memory referralCode
    ) public payable override nonReentrant {
        _enforseDomainNameIsValid(domainName);
        _validateRegistration(newRecord, domainName, registrarSignature, signatureDeadline);
        LibMultipass.DomainStorage storage _domain = LibMultipass._getDomainStorage(domainName);
        (bool hasValidReferrer, LibMultipass.Record memory referrerRecord) = LibMultipass.resolveRecord(referrer);
        uint256 referrersShare = 0;
        if (!LibMultipass.shouldRegisterForFree(_domain)) {
            referrersShare = hasValidReferrer ? _domain.properties.referrerReward : 0;
            uint256 valueToPay = _domain.properties.fee - (hasValidReferrer ? _domain.properties.referralDiscount : 0);
            require(msg.value >= valueToPay, "Multipass->register: Payment value is not enough");
        }
        LibMultipass._registerNew(newRecord, _domain);
        emit Registered(_domain.properties.name, newRecord);
        if (hasValidReferrer) {
            bytes memory refferalMessage = abi.encode(LibMultipass._TYPEHASH_REFERRAL, referrerRecord.wallet);
            require(
                _isValidSignature(refferalMessage, referralCode, referrerRecord.wallet),
                "Multipass->register: Referral code is not valid"
            );
            (bool success, ) = payable(referrerRecord.wallet).call{value: referrersShare}("");
            require(success, "Multipass->register: Failed to send referral reward");
            require(referrerRecord.wallet != newRecord.wallet, "Cannot refer yourself");
            emit Referred(referrerRecord, newRecord, domainName);
        }
    }
    /// @inheritdoc IMultipass
    function getModifyPrice(LibMultipass.NameQuery memory query) public view override returns (uint256) {
        (bool userExists, LibMultipass.Record memory record) = LibMultipass.resolveRecord(query);
        require(userExists, "getModifyPrice->user not found ");
        return LibMultipass._getModifyPrice(record);
    }

    /// @inheritdoc IMultipass
    function modifyUserName(
        bytes32 domainName,
        LibMultipass.NameQuery memory query,
        bytes32 newName,
        bytes memory registrarSignature,
        uint256 signatureDeadline
    ) public payable override {
        _enforseDomainNameIsValid(domainName);
        query.targetDomain = domainName;
        LibMultipass.DomainStorage storage _domain = LibMultipass._getDomainStorage(domainName);
        require(_domain.properties.isActive, "Multipass->modifyUserName: LibMultipass.Domain is not active");
        require(newName != bytes32(0), "Multipass->modifyUserName: Name cannot be empty");
        require(
            signatureDeadline >= block.number,
            "Multipass->modifyUserName: Signature deadline must be greater than current block number"
        );

        (bool userExists, LibMultipass.Record memory userRecord) = LibMultipass.resolveRecord(query);
        LibMultipass.Record memory newRecord = userRecord;
        bytes32 oldName = newRecord.name;
        newRecord.name = newName;
        require(userExists, "user does not exist, use register() instead");
        bytes memory registrarMessage = abi.encode(
            LibMultipass._TYPEHASH,
            newRecord.name,
            newRecord.id,
            newRecord.domainName,
            signatureDeadline,
            userRecord.nonce
        );
        require(
            _isValidSignature(registrarMessage, registrarSignature, _domain.properties.registrar),
            "Multipass->modifyUserName: Not a valid signature"
        );

        uint256 _fee = LibMultipass._getModifyPrice(newRecord);

        require(msg.value >= _fee, "Multipass->modifyUserName: Not enough payment");
        require(_domain.nonce[userRecord.id] == userRecord.nonce, "Multipass->modifyUserName: invalid nonce");
        require(_domain.nameToId[newName] == bytes32(0), "OveMultipass->modifyUserName: new name already exists");

        LibMultipass._setRecord(_domain, newRecord);
        _domain.nameToId[_domain.idToName[newRecord.id]] = bytes32(0);

        emit UserRecordModified(newRecord, oldName, domainName);
    }

    /// @inheritdoc IMultipass
    function getBalance() external view override returns (uint256) {
        return address(this).balance;
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

    /// @inheritdoc IMultipass
    function withdrawFunds(address to) public onlyOwner {
        (bool success, ) = payable(to).call{value: address(this).balance}("");
        require(success, "Transfer failed");
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
    return interfaceId == type(IMultipass).interfaceId || super.supportsInterface(interfaceId);
}

}