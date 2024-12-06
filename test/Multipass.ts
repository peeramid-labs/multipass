import { AdrSetupResult, EnvSetupResult, SignerIdentity, setupTest } from './utils';
import { setupAddresses, setupEnvironment, getUserRegisterProps, signRegistrarMessage } from './utils';
import { getInterfaceID } from '../scripts/libraries/utils';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { IMultipass__factory } from '../types';
const path = require('path');
import { LibMultipass } from '../types/src/Multipass';

const scriptName = path.basename(__filename);
const NEW_DOMAIN_NAME1 = 'newDomainName1';
const NEW_DOMAIN_NAME2 = 'newDomainName2';
const NOT_ENOUGH_FEE = ethers.utils.parseEther('0.17');
const DEFAULT_FEE = ethers.utils.parseEther('2');
const DEFAULT_RENEWAL_FEE = ethers.utils.parseEther('1');
const FEE_AFTER_CHANGE = ethers.utils.parseEther('3');
const DEFAULT_DISCOUNT = ethers.utils.parseEther('1');
const DEFAULT_REWARD = ethers.utils.parseEther('0.5');
let adr: AdrSetupResult;
let blockTimestamp: number;
let env: EnvSetupResult;

const emptyUserQuery: LibMultipass.NameQueryStruct = {
  name: ethers.utils.formatBytes32String(''),
  id: ethers.utils.formatBytes32String(''),
  domainName: ethers.utils.formatBytes32String(''),
  wallet: ethers.constants.AddressZero,
  targetDomain: ethers.utils.formatBytes32String(''),
};

describe(scriptName, () => {
  beforeEach(async () => {
    const setup = await setupTest();
    adr = setup.adr;
    env = setup.env;
    blockTimestamp = await ethers.provider.getBlock('latest').then(block => block.timestamp);
  });
  it('Is Owned by contract owner', async () => {
    expect(await env.multipass.owner()).to.be.equal(adr.multipassOwner.wallet.address);
  });
  it('Transfer ownership can be done only by contract owner', async () => {
    await expect(
      env.multipass.connect(adr.multipassOwner.wallet).transferOwnership(adr.gameCreator1.wallet.address),
    ).to.emit(env.multipass, 'OwnershipTransferred(address,address)');

    await expect(
      env.multipass.connect(adr.maliciousActor1.wallet).transferOwnership(adr.gameCreator1.wallet.address),
    ).to.revertedWithCustomError(env.multipass, 'OwnableUnauthorizedAccount');
  });
  it('Has zero domains', async () => {
    expect(await env.multipass.getContractState()).to.be.equal(0);
  });
  it('Supports multipass interface', async () => {
    const MultipassInterface = IMultipass__factory.createInterface();
    const multipassInterfaceId = getInterfaceID(MultipassInterface);
    expect(await env.multipass.supportsInterface(multipassInterfaceId._hex)).to.be.true;
  });
  it('Emits and increments when new domain initialized', async () => {
    await expect(
      await env.multipass
        .connect(adr.multipassOwner.wallet)
        .initializeDomain(
          adr.registrar1.wallet.address,
          ethers.utils.parseEther('3'),
          ethers.utils.parseEther('1'),
          ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
          ethers.utils.parseEther('1'),
          ethers.utils.parseEther('1'),
        ),
    ).to.emit(env.multipass, 'InitializedDomain');
    expect(await env.multipass.getContractState()).to.be.equal(1);
  });
  it('can get contract state', async () => {
    const state = await env.multipass.getContractState();
    expect(state).to.be.equal(0);
  });
  it('Reverts domain specific methods if domain does not exists', async () => {
    await expect(
      env.multipass
        .connect(adr.multipassOwner.wallet)
        .activateDomain(ethers.utils.formatBytes32String('invalidDomain')),
    ).to.be.revertedWithCustomError(env.multipass, 'invalidDomain');
    await expect(
      env.multipass
        .connect(adr.multipassOwner.wallet)
        .deactivateDomain(ethers.utils.formatBytes32String('invalidDomain')),
    ).to.be.revertedWithCustomError(env.multipass, 'invalidDomain');
    await expect(
      env.multipass
        .connect(adr.multipassOwner.wallet)
        .changeFee(ethers.utils.formatBytes32String('invalidDomain'), '1'),
    ).to.be.revertedWithCustomError(env.multipass, 'invalidDomain');
    await expect(
      env.multipass
        .connect(adr.multipassOwner.wallet)
        .changeRegistrar(ethers.utils.formatBytes32String('invalidDomain'), adr.gameCreator1.wallet.address),
    ).to.be.revertedWithCustomError(env.multipass, 'invalidDomain');
    const invalidDomainQuery = { ...emptyUserQuery };
    invalidDomainQuery.domainName = ethers.utils.formatBytes32String('invalidDomain');
    invalidDomainQuery.targetDomain = ethers.utils.formatBytes32String('invalidDomain');

    const registrarMessage = {
      name: ethers.utils.formatBytes32String(adr.player1.name),
      id: ethers.utils.formatBytes32String(adr.player1.id),
      domainName: ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
      validUntil: ethers.BigNumber.from(blockTimestamp + 9999),
      nonce: ethers.BigNumber.from(0),
    };

    const registrarSignature = await signRegistrarMessage(registrarMessage, env.multipass.address, adr.registrar1);

    await expect(
      env.multipass.connect(adr.multipassOwner.wallet).deleteName(invalidDomainQuery),
    ).to.be.revertedWithCustomError(env.multipass, 'invalidDomain');

    let applicantData: LibMultipass.RecordStruct = {
      name: ethers.utils.formatBytes32String(adr.player1.name),
      id: ethers.utils.formatBytes32String(adr.player1.id),
      wallet: adr.player1.wallet.address,
      nonce: 0,
      domainName: ethers.utils.formatBytes32String('invalidDomain'),
      validUntil: registrarMessage.validUntil,
    };

    await expect(
      env.multipass
        .connect(adr.multipassOwner.wallet)
        .register(applicantData, registrarSignature, emptyUserQuery, ethers.constants.HashZero),
    ).to.be.revertedWithCustomError(env.multipass, 'invalidDomain');
  });
  it('Reverts if initializing domain name props are wrong', async () => {
    await expect(
      env.multipass
        .connect(adr.multipassOwner.wallet)
        .initializeDomain(
          adr.registrar1.wallet.address,
          ethers.utils.parseEther('3'),
          ethers.utils.parseEther('1'),
          ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
          ethers.utils.parseEther('1.0001'),
          ethers.utils.parseEther('2'),
        ),
    ).to.be.revertedWithCustomError(env.multipass, 'referralRewardsTooHigh');
    await expect(
      env.multipass
        .connect(adr.multipassOwner.wallet)
        .initializeDomain(
          ethers.constants.AddressZero,
          ethers.utils.parseEther('3'),
          ethers.utils.parseEther('1'),
          ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
          ethers.utils.parseEther('1.0001'),
          ethers.utils.parseEther('2'),
        ),
    ).to.be.revertedWithCustomError(env.multipass, 'invalidRegistrar');
    await expect(
      env.multipass
        .connect(adr.multipassOwner.wallet)
        .initializeDomain(
          adr.registrar1.wallet.address,
          ethers.utils.parseEther('3'),
          ethers.utils.parseEther('1'),
          ethers.utils.formatBytes32String(''),
          ethers.utils.parseEther('1'),
          ethers.utils.parseEther('2'),
        ),
    ).to.be.revertedWithCustomError(env.multipass, 'invalidQuery');

    await expect(
      env.multipass
        .connect(adr.multipassOwner.wallet)
        .initializeDomain(
          adr.registrar1.wallet.address,
          ethers.constants.MaxUint256,
          ethers.utils.parseEther('1'),
          ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
          ethers.constants.MaxUint256,
          ethers.utils.parseEther('1'),
        ),
    ).to.be.revertedWithCustomError(env.multipass, 'mathOverflow');
  });
  it('Reverts any ownerOnly call by not an owner', async () => {
    await expect(
      env.multipass
        .connect(adr.maliciousActor1.wallet)
        .changeReferralProgram(DEFAULT_REWARD, DEFAULT_DISCOUNT, ethers.utils.formatBytes32String('')),
    ).to.be.revertedWithCustomError(env.multipass, 'OwnableUnauthorizedAccount');
    await expect(
      env.multipass.connect(adr.maliciousActor1.wallet).deleteName(emptyUserQuery),
    ).to.be.revertedWithCustomError(env.multipass, 'OwnableUnauthorizedAccount');
    await expect(
      env.multipass
        .connect(adr.maliciousActor1.wallet)
        .changeRegistrar(ethers.utils.formatBytes32String(''), adr.maliciousActor1.wallet.address),
    ).to.be.revertedWithCustomError(env.multipass, 'OwnableUnauthorizedAccount');
    await expect(
      env.multipass.connect(adr.maliciousActor1.wallet).changeFee(ethers.utils.formatBytes32String(''), DEFAULT_FEE),
    ).to.be.revertedWithCustomError(env.multipass, 'OwnableUnauthorizedAccount');
    await expect(
      env.multipass.connect(adr.maliciousActor1.wallet).activateDomain(ethers.utils.formatBytes32String('')),
    ).to.be.revertedWithCustomError(env.multipass, 'OwnableUnauthorizedAccount');
    await expect(
      env.multipass.connect(adr.maliciousActor1.wallet).deactivateDomain(ethers.utils.formatBytes32String('')),
    ).to.be.revertedWithCustomError(env.multipass, 'OwnableUnauthorizedAccount');
    await expect(
      env.multipass
        .connect(adr.maliciousActor1.wallet)
        .initializeDomain(
          adr.maliciousActor1.wallet.address,
          DEFAULT_FEE,
          DEFAULT_RENEWAL_FEE,
          ethers.utils.formatBytes32String(''),
          DEFAULT_REWARD,
          DEFAULT_DISCOUNT,
        ),
    ).to.be.revertedWithCustomError(env.multipass, 'OwnableUnauthorizedAccount');
  });
  describe('When a new domain was initialized', () => {
    let numDomains = 0;
    beforeEach(async () => {
      await env.multipass
        .connect(adr.multipassOwner.wallet)
        .initializeDomain(
          adr.registrar1.wallet.address,
          DEFAULT_FEE,
          DEFAULT_RENEWAL_FEE,
          ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
          DEFAULT_REWARD,
          DEFAULT_DISCOUNT,
        );
      numDomains = 1;
    });
    it('allows owner to change renew fee', async () => {
      await expect(
        env.multipass
          .connect(adr.multipassOwner.wallet)
          .changeRenewalFee(ethers.utils.parseEther('2'), ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1)),
      ).to.emit(env.multipass, 'RenewalFeeChanged');

      await expect(
        env.multipass
          .connect(adr.player1.wallet)
          .changeRenewalFee(ethers.utils.parseEther('2'), ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1)),
      ).to.be.revertedWithCustomError(env.multipass, 'OwnableUnauthorizedAccount');
    });
    it('allows owner to change referral program', async () => {
      await expect(
        env.multipass
          .connect(adr.multipassOwner.wallet)
          .changeReferralProgram(DEFAULT_REWARD, DEFAULT_DISCOUNT, ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1)),
      ).to.emit(env.multipass, 'ReferralProgramChanged');
    });
    it('Reverts if domain name already registered', async () => {
      await expect(
        env.multipass
          .connect(adr.multipassOwner.wallet)
          .initializeDomain(
            adr.registrar1.wallet.address,
            DEFAULT_FEE,
            DEFAULT_RENEWAL_FEE,
            ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
            DEFAULT_REWARD,
            DEFAULT_DISCOUNT,
          ),
      ).to.be.revertedWithCustomError(env.multipass, 'nameExists');
    });
    it('Domain name state is equal to initial values and is not active', async () => {
      const resp = await env.multipass.getDomainState(ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1));
      // expect(ethers.utils.parseBytes32String(resp)).to.be.equal(
      //   NEW_DOMAIN_NAME1
      // );
      expect(ethers.utils.parseBytes32String(resp['name'])).to.be.equal(NEW_DOMAIN_NAME1);
      expect(resp['fee']).to.be.equal(DEFAULT_FEE);
      expect(resp['referrerReward']).to.be.equal(DEFAULT_REWARD);
      expect(resp['referralDiscount']).to.be.equal(DEFAULT_DISCOUNT);
      expect(resp['isActive']).to.be.equal(false);
      expect(resp['registrar']).to.be.equal(adr.registrar1.wallet.address);
      expect(resp['ttl']).to.be.equal(0);
      expect(resp['registerSize'].toString()).to.be.equal('0');
    });
    it('Incremented number of domains', async () => {
      expect(await env.multipass.getContractState()).to.be.equal(numDomains);
    });
    it('emits when domain activated', async () => {
      await expect(
        env.multipass
          .connect(adr.multipassOwner.wallet)
          .activateDomain(ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1)),
      ).to.emit(env.multipass, 'DomainActivated');
    });
    it('Does not allow to register because is not active', async () => {
      let applicantData: LibMultipass.RecordStruct = {
        name: ethers.utils.formatBytes32String(adr.player1.name),
        id: ethers.utils.formatBytes32String(adr.player1.id),
        wallet: adr.player1.wallet.address,
        nonce: 0,
        domainName: ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
        validUntil: blockTimestamp + 9999,
      };
      await expect(
        env.multipass
          .connect(adr.player1.wallet)
          .register(applicantData, ethers.constants.HashZero, emptyUserQuery, ethers.constants.HashZero),
      ).to.be.revertedWithCustomError(env.multipass, 'isActive');
    });
    it('Emits and changes fee', async () => {
      await expect(
        env.multipass
          .connect(adr.multipassOwner.wallet)
          .changeFee(ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1), FEE_AFTER_CHANGE),
      ).to.emit(env.multipass, 'DomainFeeChanged');

      const resp = await env.multipass
        .connect(adr.player1.wallet)
        .getDomainState(ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1));
      expect(resp[1]).to.be.equal(FEE_AFTER_CHANGE);
    });
    describe('when domain was set to active', () => {
      beforeEach(async () => {
        await env.multipass
          .connect(adr.multipassOwner.wallet)
          .activateDomain(ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1));
      });
      it('Is set to active', async () => {
        const resp = await env.multipass.getDomainState(ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1));
        expect(resp['isActive']).to.be.true;
      });

      it('Emits on register when properties are valid', async () => {
        const registrarMessage = {
          name: ethers.utils.formatBytes32String(adr.player1.name),
          id: ethers.utils.formatBytes32String(adr.player1.id),
          domainName: ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
          validUntil: ethers.BigNumber.from(blockTimestamp + 9999),
          nonce: ethers.BigNumber.from(0),
        };

        const registrarSignature = await signRegistrarMessage(registrarMessage, env.multipass.address, adr.registrar1);

        let applicantData: LibMultipass.RecordStruct = {
          name: ethers.utils.formatBytes32String(adr.player1.name),
          id: ethers.utils.formatBytes32String(adr.player1.id),
          wallet: adr.player1.wallet.address,
          nonce: 0,
          domainName: ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
          validUntil: registrarMessage.validUntil,
        };

        await expect(
          env.multipass
            .connect(adr.player1.wallet)
            .register(applicantData, registrarSignature, emptyUserQuery, ethers.constants.HashZero, {
              value: DEFAULT_FEE,
            }),
        ).to.emit(env.multipass, 'Registered');
      });

      it('Reverts on register if properties are invalid', async () => {
        const registrarMessage = {
          name: ethers.utils.formatBytes32String(adr.player1.name),
          id: ethers.utils.formatBytes32String(adr.player1.id),
          domainName: ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
          validUntil: ethers.BigNumber.from(blockTimestamp + 9999),
          nonce: ethers.BigNumber.from(0),
        };

        const invalidRegistrarSignature = await signRegistrarMessage(
          registrarMessage,
          env.multipass.address,
          adr.maliciousActor1,
        );

        let applicantData: LibMultipass.RecordStruct = {
          name: ethers.utils.formatBytes32String(adr.player1.name),
          id: ethers.utils.formatBytes32String(adr.player1.id),
          wallet: adr.player1.wallet.address,
          nonce: 0,
          domainName: ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
          validUntil: registrarMessage.validUntil,
        };

        await expect(
          env.multipass
            .connect(adr.player1.wallet)
            .register(applicantData, invalidRegistrarSignature, emptyUserQuery, ethers.constants.HashZero),
        ).to.be.revertedWithCustomError(env.multipass, 'invalidSignature');

        registrarMessage.validUntil = ethers.BigNumber.from(ethers.provider.blockNumber);

        // await expect(
        //   env.multipass
        //     .connect(adr.player1.wallet)
        //     .register(
        //       applicantData,
        //       registrarMessage.domainName,
        //       await signRegistrarMessage(registrarMessage, env.multipass.address, adr.registrar1),
        //       registrarMessage.validUntil,
        //       emptyUserQuery,
        //       ethers.constants.HashZero,
        //     ),
        // ).to.be.revertedWith('Multipass->register: ValidUntil is less than current block number');
      });
      it('Reverts if signature is outdated', async () => {
        const registrantProps1 = await getUserRegisterProps({
          account: adr.player2,
          registrar: adr.registrar1,
          domainName: NEW_DOMAIN_NAME1,
          validUntil: 1,
          multipassAddress: env.multipass.address,
        });
        await expect(
          env.multipass
            .connect(adr.player1.wallet)
            .register(
              registrantProps1.applicantData,
              registrantProps1.validSignature,
              emptyUserQuery,
              ethers.constants.HashZero,
              { value: DEFAULT_FEE },
            ),
        ).to.be.revertedWithCustomError(env.multipass, 'signatureExpired');
      });
      it("allows changing registrar's address only to owner", async () => {
        await expect(
          env.multipass
            .connect(adr.multipassOwner.wallet)
            .changeRegistrar(ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1), adr.gameCreator1.wallet.address),
        ).to.emit(env.multipass, 'RegistrarChanged');
        await expect(
          env.multipass
            .connect(adr.maliciousActor1.wallet)
            .changeRegistrar(ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1), adr.gameCreator1.wallet.address),
        ).to.be.revertedWithCustomError(env.multipass, 'OwnableUnauthorizedAccount');
      });
      it('can get domain state by id', async () => {
        const resp = await env.multipass.getDomainStateById(1);
        expect(resp['isActive']).to.be.true;
      });
      it("allows only owner to deactivate domain's name", async () => {
        await expect(
          env.multipass
            .connect(adr.multipassOwner.wallet)
            .deactivateDomain(ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1)),
        ).to.emit(env.multipass, 'DomainDeactivated');

        await expect(
          env.multipass
            .connect(adr.maliciousActor1.wallet)
            .deactivateDomain(ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1)),
        ).to.be.revertedWithCustomError(env.multipass, 'OwnableUnauthorizedAccount');
      });
      describe('When user was registered', () => {
        let numDomains = 0;
        beforeEach(async () => {
          const regProps = await getUserRegisterProps({
            account: adr.player1,
            registrar: adr.registrar1,
            domainName: NEW_DOMAIN_NAME1,
            validUntil: blockTimestamp + 999999999,
            multipassAddress: env.multipass.address,
          });

          await env.multipass
            .connect(adr.player1.wallet)
            .register(regProps.applicantData, regProps.validSignature, emptyUserQuery, ethers.constants.HashZero, {
              value: DEFAULT_FEE,
            });
        });
        it('Can find newly registered user ', async () => {
          //By full query
          let query: LibMultipass.NameQueryStruct = {
            name: ethers.utils.formatBytes32String(adr.player1.name + `.` + NEW_DOMAIN_NAME1),
            id: ethers.utils.formatBytes32String(adr.player1.id + `.` + NEW_DOMAIN_NAME1),
            wallet: adr.player1.wallet.address,
            domainName: ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
            targetDomain: ethers.utils.formatBytes32String(''),
          };

          let resp = await env.multipass.connect(adr.player1.wallet).resolveRecord(query);
          expect(resp[0]).to.be.true;

          //With id and address
          query = {
            name: ethers.utils.formatBytes32String(''),
            id: ethers.utils.formatBytes32String(adr.player1.id + `.` + NEW_DOMAIN_NAME1),
            wallet: adr.player1.wallet.address,
            domainName: ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
            targetDomain: ethers.utils.formatBytes32String(''),
          };

          resp = await env.multipass.connect(adr.player1.wallet).resolveRecord(query);
          expect(resp[0]).to.be.true;

          //With only id
          query = {
            name: ethers.utils.formatBytes32String(''),
            id: ethers.utils.formatBytes32String(adr.player1.id + `.` + NEW_DOMAIN_NAME1),
            wallet: ethers.constants.AddressZero,
            domainName: ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
            targetDomain: ethers.utils.formatBytes32String(''),
          };

          resp = await env.multipass.connect(adr.player1.wallet).resolveRecord(query);
          expect(resp[0]).to.be.true;

          //With only address
          query = {
            name: ethers.utils.formatBytes32String(''),
            id: ethers.utils.formatBytes32String(''),
            wallet: adr.player1.wallet.address,
            domainName: ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
            targetDomain: ethers.utils.formatBytes32String(''),
          };

          resp = await env.multipass.connect(adr.player1.wallet).resolveRecord(query);
          expect(resp[0]).to.be.true;

          //With only name
          query = {
            name: ethers.utils.formatBytes32String(adr.player1.name + `.` + NEW_DOMAIN_NAME1),
            id: ethers.utils.formatBytes32String(''),
            wallet: ethers.constants.AddressZero,
            domainName: ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
            targetDomain: ethers.utils.formatBytes32String(''),
          };

          resp = await env.multipass.connect(adr.player1.wallet).resolveRecord(query);
          expect(resp[0]).to.be.true;
        });
        it("Can renew user's registration only with signature that has larger nonce", async () => {
          const regProps = await getUserRegisterProps({
            account: adr.player1,
            registrar: adr.registrar1,
            domainName: NEW_DOMAIN_NAME1,
            validUntil: blockTimestamp + 100,
            multipassAddress: env.multipass.address,
          });

          let query: LibMultipass.NameQueryStruct = {
            name: ethers.utils.formatBytes32String(adr.player1.name),
            id: ethers.utils.formatBytes32String(adr.player1.id),
            wallet: adr.player1.wallet.address,
            domainName: ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
            targetDomain: ethers.utils.formatBytes32String(''),
          };

          await expect(
            env.multipass
              .connect(adr.player1.wallet)
              .renewRecord(query, regProps.applicantData, regProps.validSignature),
          ).to.be.revertedWithCustomError(env.multipass, 'invalidNonceIncrement');

          const regProps2 = await getUserRegisterProps({
            account: adr.player1,
            registrar: adr.registrar1,
            domainName: NEW_DOMAIN_NAME1,
            validUntil: blockTimestamp + 100,
            multipassAddress: env.multipass.address,
            nonce: 2,
          });
          await expect(
            env.multipass
              .connect(adr.player1.wallet)
              .renewRecord(query, regProps2.applicantData, regProps2.validSignature),
          ).to.be.revertedWithCustomError(env.multipass, 'paymentTooLow');

          await expect(
            env.multipass
              .connect(adr.player1.wallet)
              .renewRecord(query, regProps2.applicantData, regProps2.validSignature, { value: DEFAULT_RENEWAL_FEE }),
          ).to.be.emit(env.multipass, 'Renewed');
        });
        it('Reverts registration if user id already exist', async () => {
          const regProps = await getUserRegisterProps({
            account: adr.player1,
            registrar: adr.registrar1,
            domainName: NEW_DOMAIN_NAME1,
            validUntil: blockTimestamp + 99999,
            multipassAddress: env.multipass.address,
          });
          await expect(
            env.multipass
              .connect(adr.player1.wallet)
              .register(regProps.applicantData, regProps.validSignature, emptyUserQuery, ethers.constants.HashZero),
          ).to.be.revertedWithCustomError(env.multipass, 'recordExists');
          regProps.applicantData.id = ethers.utils.formatBytes32String(adr.player2.id);
          await expect(
            env.multipass
              .connect(adr.player1.wallet)
              .register(regProps.applicantData, regProps.validSignature, emptyUserQuery, ethers.constants.HashZero),
          ).to.be.revertedWithCustomError(env.multipass, 'recordExists');
          regProps.applicantData.name = ethers.utils.formatBytes32String(adr.player2.name);
          await expect(
            env.multipass
              .connect(adr.player1.wallet)
              .register(regProps.applicantData, regProps.validSignature, emptyUserQuery, ethers.constants.HashZero),
          ).to.be.revertedWithCustomError(env.multipass, 'recordExists');
        });
        it('Emits when register with valid referral code', async () => {
          const registrantProps = await getUserRegisterProps({
            account: adr.player2,
            registrar: adr.registrar1,
            domainName: NEW_DOMAIN_NAME1,
            validUntil: blockTimestamp + 99999,
            multipassAddress: env.multipass.address,
            referrer: adr.player1,
          });
          await expect(
            env.multipass
              .connect(adr.player1.wallet)
              .register(
                registrantProps.applicantData,
                registrantProps.validSignature,
                registrantProps.referrerData,
                registrantProps.referrerSignature,
                { value: DEFAULT_FEE },
              ),
          ).to.emit(env.multipass, 'Referred');
        });
        it('Emits and deletes user', async () => {
          let query: LibMultipass.NameQueryStruct = {
            name: ethers.utils.formatBytes32String(adr.player1.name + `.` + NEW_DOMAIN_NAME1),
            id: ethers.utils.formatBytes32String(adr.player1.id + `.` + NEW_DOMAIN_NAME1),
            wallet: adr.player1.wallet.address,
            domainName: ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
            targetDomain: ethers.utils.formatBytes32String(''),
          };

          await expect(env.multipass.connect(adr.multipassOwner.wallet).deleteName(query)).to.emit(
            env.multipass,
            'nameDeleted',
          );

          let resp = await env.multipass.connect(adr.player1.wallet).resolveRecord(query);
          expect(resp[0]).to.be.false;
        });
        describe('When second domain is initialized and active', () => {
          beforeEach(async () => {
            await env.multipass
              .connect(adr.multipassOwner.wallet)
              .initializeDomain(
                adr.registrar1.wallet.address,
                DEFAULT_FEE,
                DEFAULT_RENEWAL_FEE,
                ethers.utils.formatBytes32String(NEW_DOMAIN_NAME2),
                DEFAULT_REWARD,
                DEFAULT_DISCOUNT,
              );
            await env.multipass
              .connect(adr.multipassOwner.wallet)
              .activateDomain(ethers.utils.formatBytes32String(NEW_DOMAIN_NAME2));
          });
          it('Reverts on referring yourself from a different domain', async () => {
            const registrantProps1 = await getUserRegisterProps({
              account: adr.player2,
              registrar: adr.registrar1,
              domainName: NEW_DOMAIN_NAME1,
              validUntil: blockTimestamp + 99999,
              multipassAddress: env.multipass.address,
            });
            await env.multipass
              .connect(adr.player2.wallet)
              .register(
                registrantProps1.applicantData,
                registrantProps1.validSignature,
                registrantProps1.referrerData,
                registrantProps1.referrerSignature,
                { value: DEFAULT_FEE },
              );
            const registrantProps2 = await getUserRegisterProps({
              account: adr.player2,
              registrar: adr.registrar1,
              domainName: NEW_DOMAIN_NAME2,
              validUntil: blockTimestamp + 99999,
              multipassAddress: env.multipass.address,
              referrer: adr.player2,
              referrerDomain: NEW_DOMAIN_NAME1,
            });
            const registrantProps21 = await getUserRegisterProps({
              account: adr.player2,
              registrar: adr.registrar1,
              domainName: NEW_DOMAIN_NAME1,
              validUntil: blockTimestamp + 99999,
              multipassAddress: env.multipass.address,
              referrer: adr.player2,
            });
            await expect(
              env.multipass
                .connect(adr.player2.wallet)
                .register(
                  registrantProps2.applicantData,
                  registrantProps2.validSignature,
                  registrantProps21.referrerData,
                  registrantProps2.referrerSignature,
                  { value: DEFAULT_FEE },
                ),
            ).to.revertedWithCustomError(env.multipass, 'referredSelf');
          });

          it('Can register same user on both domains and do cross domain lookup', async () => {
            const registrantProps1 = await getUserRegisterProps({
              account: adr.player1,
              registrar: adr.registrar1,
              domainName: NEW_DOMAIN_NAME2,
              validUntil: blockTimestamp + 99999,
              multipassAddress: env.multipass.address,
            });
            await expect(
              env.multipass
                .connect(adr.player1.wallet)
                .register(
                  registrantProps1.applicantData,
                  registrantProps1.validSignature,
                  registrantProps1.referrerData,
                  registrantProps1.referrerSignature,
                  { value: DEFAULT_FEE },
                ),
            ).to.emit(env.multipass, 'Registered');

            const crossDomainQuery: LibMultipass.NameQueryStruct = {
              name: ethers.utils.formatBytes32String(adr.player1.name + `.` + NEW_DOMAIN_NAME2),
              id: ethers.utils.formatBytes32String(''),
              domainName: ethers.utils.formatBytes32String(NEW_DOMAIN_NAME2),
              wallet: ethers.constants.AddressZero,
              targetDomain: ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
            };
            const resp = await env.multipass.connect(adr.player1.wallet).resolveRecord(crossDomainQuery);
            expect(resp[0]).to.be.true;
            expect(ethers.utils.parseBytes32String(resp[1][1])).to.be.equal(adr.player1.name + `.` + NEW_DOMAIN_NAME1);
          });
        });
      });

      it('Should allow registering with paying ether', async () => {
        const registrantProps1 = await getUserRegisterProps({
          account: adr.player1,
          registrar: adr.registrar1,
          domainName: NEW_DOMAIN_NAME1,
          validUntil: blockTimestamp + 99999,
          multipassAddress: env.multipass.address,
        });
        await expect(
          env.multipass
            .connect(adr.player1.wallet)
            .register(
              registrantProps1.applicantData,
              registrantProps1.validSignature,
              registrantProps1.referrerData,
              registrantProps1.referrerSignature,
              { value: DEFAULT_FEE },
            ),
        ).to.emit(env.multipass, 'Registered');
      });
      it('Owner receives payment', async () => {
        const registrantProps1 = await getUserRegisterProps({
          account: adr.player1,
          registrar: adr.registrar1,
          domainName: NEW_DOMAIN_NAME1,
          validUntil: blockTimestamp + 99999,
          multipassAddress: env.multipass.address,
        });
        const balanceBefore = await ethers.provider.getBalance(adr.multipassOwner.wallet.address);
        await env.multipass
          .connect(adr.player1.wallet)
          .register(
            registrantProps1.applicantData,
            registrantProps1.validSignature,
            registrantProps1.referrerData,
            registrantProps1.referrerSignature,
            { value: DEFAULT_FEE },
          );
        const balanceAfter = await ethers.provider.getBalance(adr.multipassOwner.wallet.address);
        expect(balanceAfter).to.be.equal(balanceBefore.add(DEFAULT_FEE));
      });
      it('Should revert register if not enough ether', async () => {
        const registrantProps1 = await getUserRegisterProps({
          account: adr.player1,
          registrar: adr.registrar1,
          domainName: NEW_DOMAIN_NAME1,
          validUntil: blockTimestamp + 99999,
          multipassAddress: env.multipass.address,
        });
        await expect(
          env.multipass
            .connect(adr.player1.wallet)
            .register(
              registrantProps1.applicantData,
              registrantProps1.validSignature,
              registrantProps1.referrerData,
              registrantProps1.referrerSignature,
              { value: NOT_ENOUGH_FEE },
            ),
        ).to.be.revertedWithCustomError(env.multipass, 'paymentTooLow');
      });
      it.only('Should prevent registration with same user id but different wallet', async () => {
        const registrantProps1 = await getUserRegisterProps({
          account: { ...adr.player1, id: ethers.utils.formatBytes32String('different-id') },
          registrar: adr.registrar1,
          domainName: NEW_DOMAIN_NAME1,
          validUntil: blockTimestamp + 99999,
          nonce: 1,
          multipassAddress: env.multipass.address,
        });

        await env.multipass
          .connect(adr.player1.wallet)
          .register(
            registrantProps1.applicantData,
            registrantProps1.validSignature,
            registrantProps1.referrerData,
            registrantProps1.referrerSignature,
            { value: DEFAULT_FEE },
          );

        // Try to register with same username but different wallet
        const registrantProps2 = await getUserRegisterProps({
          account: { ...adr.player2, id: ethers.utils.formatBytes32String('different-id') },
          registrar: adr.registrar1,
          domainName: NEW_DOMAIN_NAME1,
          validUntil: blockTimestamp + 99999,
          nonce: 1,
          multipassAddress: env.multipass.address,
        });

        await expect(
          env.multipass
            .connect(adr.player2.wallet)
            .register(
              registrantProps2.applicantData,
              registrantProps2.validSignature,
              registrantProps2.referrerData,
              registrantProps2.referrerSignature,
              { value: DEFAULT_FEE },
            ),
        ).to.be.revertedWithCustomError(env.multipass, 'recordExists');
      });
    });
  });
});
