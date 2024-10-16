 
 
 
// import { time } from "@openzeppelin/test-helpers";
import hre, { deployments } from 'hardhat';
import aes from 'crypto-js/aes';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Multipass } from '../types';
import { BigNumber, BigNumberish, BytesLike, Wallet } from 'ethers';
// @ts-ignore
import { assert } from 'console';
import { Deployment } from 'hardhat-deploy/types';
import { HardhatEthersHelpers } from '@nomiclabs/hardhat-ethers/types';
import { MultipassJs } from '../utils/multipass';
import { JsonFragment } from '@ethersproject/abi';
import fs from 'fs';
import path from 'path';
import { LibMultipass } from '../types/src/Multipass';

export const MULTIPASS_CONTRACT_NAME = 'MultipassDNS';
export const MULTIPASS_CONTRACT_VERSION = '0.0.1';

export interface SignerIdentity {
  name: string;
  id: string;
  wallet: Wallet | SignerWithAddress;
}
export interface AdrSetupResult {
  contractDeployer: SignerIdentity;
  player1: SignerIdentity;
  player2: SignerIdentity;
  player3: SignerIdentity;
  player4: SignerIdentity;
  player5: SignerIdentity;
  player6: SignerIdentity;
  player7: SignerIdentity;
  player8: SignerIdentity;
  player9: SignerIdentity;
  player10: SignerIdentity;
  player11: SignerIdentity;
  player12: SignerIdentity;
  player13: SignerIdentity;
  player14: SignerIdentity;
  player15: SignerIdentity;
  player16: SignerIdentity;
  player17: SignerIdentity;
  player18: SignerIdentity;
  maliciousActor1: SignerIdentity;
  maliciousActor2: SignerIdentity;
  maliciousActor3: SignerIdentity;
  gameCreator1: SignerIdentity;
  gameCreator2: SignerIdentity;
  gameCreator3: SignerIdentity;
  gameMaster1: SignerIdentity;
  gameMaster2: SignerIdentity;
  gameMaster3: SignerIdentity;
  gameOwner: SignerIdentity;
  multipassOwner: SignerIdentity;
  registrar1: SignerIdentity;
}

export interface EnvSetupResult {
  multipass: Multipass;
}
export const addPlayerNameId = (idx: any) => {
  return { name: `player-${idx}`, id: `player-${idx}-id` };
};

export const setupAddresses = async (
  getNamedAccounts: () => Promise<{
    [name: string]: string;
  }>,
  _eth: typeof hre.ethers & HardhatEthersHelpers,
): Promise<AdrSetupResult> => {
  const [
    ,
    ,
    ,
    //Using first ones in hardhat deploy scripts
    _player1,
    _player2,
    _player3,
    _player4,
    _player5,
    _player6,
    _player7,
    _player8,
    _player9,
    _player10,
    _player11,
    _player12,
    _player13,
    _player14,
    _player15,
    _player16,
    _player17,
  ] = await ethers.getSigners();

  const { deployer, owner } = await getNamedAccounts();

  const createRandomIdentityAndSeedEth = async (name: string) => {
    let newWallet = await ethers.Wallet.createRandom();
    newWallet = newWallet.connect(ethers.provider);
    await _player1.sendTransaction({
      to: newWallet.address,
      value: ethers.utils.parseEther('1'),
    });

    const newIdentity: SignerIdentity = {
      wallet: newWallet,
      name: name,
      id: name + '-id',
    };
    return newIdentity;
  };

  const gameCreator1 = await createRandomIdentityAndSeedEth('gameCreator1');
  const gameCreator2 = await createRandomIdentityAndSeedEth('gameCreator2');
  const gameCreator3 = await createRandomIdentityAndSeedEth('gameCreator3');
  const maliciousActor1 = await createRandomIdentityAndSeedEth('maliciousActor');
  const registrar1 = await createRandomIdentityAndSeedEth('registrar1');
  const gameMaster1 = await createRandomIdentityAndSeedEth('GM1');
  const gameMaster2 = await createRandomIdentityAndSeedEth('GM2');
  const gameMaster3 = await createRandomIdentityAndSeedEth('GM3');
  const maliciousActor2 = await createRandomIdentityAndSeedEth('MaliciousActor2');
  const maliciousActor3 = await createRandomIdentityAndSeedEth('MaliciousActor3');
  const player18 = await createRandomIdentityAndSeedEth('player18');

  const contractDeployer: SignerIdentity = {
    wallet: await hre.ethers.getSigner(deployer),
    name: 'contractDeployer',
    id: 'contractDeployer-id',
  };

  const gameOwner: SignerIdentity = {
    wallet: await hre.ethers.getSigner(owner),
    name: 'gameOwner',
    id: 'gameOwner-id',
  };
  const player1: SignerIdentity = {
    wallet: _player1,
    name: 'player1',
    id: 'player1-id',
  };
  const player2: SignerIdentity = {
    wallet: _player2,
    name: 'player2',
    id: 'player2-id',
  };
  const player3: SignerIdentity = {
    wallet: _player3,
    name: 'player3',
    id: 'player3-id',
  };
  const player4: SignerIdentity = {
    wallet: _player4,
    name: 'player4',
    id: 'player4-id',
  };
  const player5: SignerIdentity = {
    wallet: _player5,
    name: 'player5',
    id: 'player5-id',
  };
  const player6: SignerIdentity = {
    wallet: _player6,
    name: 'player6',
    id: 'player6-id',
  };
  const player7: SignerIdentity = {
    wallet: _player7,
    name: 'player7',
    id: 'player7-id',
  };
  const player8: SignerIdentity = {
    wallet: _player8,
    name: 'player8',
    id: 'player8-id',
  };
  const player9: SignerIdentity = {
    wallet: _player9,
    name: 'player9',
    id: 'player9-id',
  };
  const player10: SignerIdentity = {
    wallet: _player10,
    name: 'player10',
    id: 'player10-id',
  };
  const player11: SignerIdentity = {
    wallet: _player11,
    name: 'player11',
    id: 'player11-id',
  };
  const player12: SignerIdentity = {
    wallet: _player12,
    name: 'player12',
    id: 'player12-id',
  };
  const player13: SignerIdentity = {
    wallet: _player13,
    name: 'player13',
    id: 'player13-id',
  };
  const player14: SignerIdentity = {
    wallet: _player14,
    name: 'player14',
    id: 'player14-id',
  };
  const player15: SignerIdentity = {
    wallet: _player15,
    name: 'player15',
    id: 'player15-id',
  };
  const player16: SignerIdentity = {
    wallet: _player16,
    name: 'player16',
    id: 'player16-id',
  };
  const player17: SignerIdentity = {
    wallet: _player17,
    name: 'player17',
    id: 'player17-id',
  };

  return {
    contractDeployer,
    player1,
    player2,
    player3,
    player4,
    player5,
    player6,
    player7,
    player8,
    player9,
    player10,
    player11,
    player12,
    player13,
    player14,
    player15,
    player16,
    player17,
    player18,
    maliciousActor1,
    gameCreator1,
    gameCreator2,
    gameCreator3,
    registrar1,
    gameMaster1,
    gameMaster2,
    gameMaster3,
    maliciousActor2,
    maliciousActor3,
    gameOwner,
    multipassOwner: gameOwner,
  };
};

const baseFee = 1 * 10 ** 18;

export const setupTest = deployments.createFixture(async ({ deployments, getNamedAccounts, ethers: _eth }, options) => {
  const adr = await setupAddresses(getNamedAccounts, _eth);
  const { deployer, owner } = await hre.getNamedAccounts();

  await adr.contractDeployer.wallet.sendTransaction({
    to: deployer,
    value: _eth.utils.parseEther('1'),
  });
  await adr.contractDeployer.wallet.sendTransaction({
    to: owner,
    value: _eth.utils.parseEther('1'),
  });
  await deployments.fixture(['multipass']);

  const env = await setupEnvironment({
    multipass: await deployments.get('Multipass'),
    adr,
  });

  return {
    adr,
    env,
  };
});
// export const setupTest = () => setupTest();
export const setupEnvironment = async (setup: {
  multipass: Deployment;
  adr: AdrSetupResult;
}): Promise<EnvSetupResult> => {
  const multipass = (await ethers.getContractAt(setup.multipass.abi, setup.multipass.address)) as Multipass;

  return {
    multipass,
  };
};

interface ReferrerMessage {
  referrerAddress: string;
}
interface RegisterMessage {
  name: BytesLike;
  id: BytesLike;
  domainName: BytesLike;
  deadline: BigNumber;
  nonce: BigNumber;
}

type signatureMessage = ReferrerMessage | RegisterMessage;

export async function mineBlocks(count: any) {
  for (let i = 0; i < count; i += 1) {
    await ethers.provider.send('evm_mine', []);
  }
}

// interface VoteSubmittion {
//   gameId: string;
//   voterHidden: string;
//   votes: string[3];
//   proof: string;
// }

// const mockVote = ({
//   voter,
// }: {
//   voter: SignerIdentity;
//   gm: SignerIdentity;
//   voteText: string;
// }): VoteSubmittion => {
//   return

// };

export interface ProposalParams {
  gameId: BigNumberish;
  encryptedProposal: string;
  commitmentHash: BytesLike;
  proposer: string;
}

export interface ProposalSubmittion {
  proposal: string;
  params: ProposalParams;
  proposerSignerId: SignerIdentity;
}

interface VoteMessage {
  vote1: BigNumberish;
  vote2: BigNumberish;
  vote3: BigNumberish;
  gameId: BigNumberish;
  turn: BigNumberish;
  salt: BytesLike;
}
interface PublicVoteMessage {
  vote1: BytesLike;
  vote2: BytesLike;
  vote3: BytesLike;
  gameId: BigNumberish;
  turn: BigNumberish;
}
const VoteTypes = {
  signVote: [
    {
      type: 'uint256',
      name: 'vote1',
    },
    {
      type: 'uint256',
      name: 'vote2',
    },
    {
      type: 'uint256',
      name: 'vote3',
    },
    {
      type: 'uint256',
      name: 'gameId',
    },
    {
      type: 'uint256',
      name: 'turn',
    },
    {
      type: 'bytes32',
      name: 'salt',
    },
  ],
};

const publicVoteTypes = {
  publicSignVote: [
    {
      type: 'uint256',
      name: 'gameId',
    },
    {
      type: 'uint256',
      name: 'turn',
    },
    {
      type: 'uint256',
      name: 'vote1',
    },
    {
      type: 'uint256',
      name: 'vote2',
    },
    {
      type: 'uint256',
      name: 'vote3',
    },
  ],
};

const MOCK_SECRET = '123456';

export const getTurnSalt = ({ gameId, turn }: { gameId: BigNumberish; turn: BigNumberish }) => {
  return ethers.utils.solidityKeccak256(['string', 'uint256', 'uint256'], [MOCK_SECRET, gameId, turn]);
};

export const getTurnPlayersSalt = ({
  gameId,
  turn,
  player,
}: {
  gameId: BigNumberish;
  turn: BigNumberish;
  player: string;
}) => {
  return ethers.utils.solidityKeccak256(['address', 'bytes32'], [player, getTurnSalt({ gameId, turn })]);
};

export const getPlayers = (
  adr: AdrSetupResult,
  numPlayers: number,
  offset?: number,
): [SignerIdentity, SignerIdentity, ...SignerIdentity[]] => {
  const _offset = offset ?? 0;
  let players: SignerIdentity[] = [];
  for (let i = 1; i < numPlayers + 1; i++) {
    assert(i + _offset < 19, 'Such player does not exist in adr generation');
    let name = `player${i + _offset}` as any as keyof AdrSetupResult;
    players.push(adr[`${name}`]);
  }
  return players as any as [SignerIdentity, SignerIdentity, ...SignerIdentity[]];
};

export const signReferralCode = async (message: ReferrerMessage, verifierAddress: string, signer: SignerIdentity) => {
  let { chainId } = await ethers.provider.getNetwork();

  const domain = {
    name: MULTIPASS_CONTRACT_NAME,
    version: MULTIPASS_CONTRACT_VERSION,
    chainId,
    verifyingContract: verifierAddress,
  };

  const types = {
    proofOfReferrer: [
      {
        type: 'address',
        name: 'referrerAddress',
      },
    ],
  };
  const s = await signer.wallet._signTypedData(domain, types, { ...message });
  return s;
};

export const getUserRegisterProps = async (
  account: SignerIdentity,
  registrar: SignerIdentity,
  domainName: string,
  deadline: number,
  multipassAddress: string,
  referrer?: SignerIdentity,
  referrerDomain?: string,
) => {
  const registrarMessage = {
    name: ethers.utils.formatBytes32String(account.name + `.` + domainName),
    id: ethers.utils.formatBytes32String(account.id + `.` + domainName),
    domainName: ethers.utils.formatBytes32String(domainName),
    deadline: ethers.BigNumber.from(deadline),
    nonce: ethers.BigNumber.from(0),
  };

  const validSignature = await signRegistrarMessage(registrarMessage, multipassAddress, registrar);

  const applicantData: LibMultipass.RecordStruct = {
    name: ethers.utils.formatBytes32String(account.name + `.` + domainName),
    id: ethers.utils.formatBytes32String(account.id + `.` + domainName),
    wallet: account.wallet.address,
    nonce: 0,
    domainName: ethers.utils.formatBytes32String(domainName),
  };

  const referrerData: LibMultipass.NameQueryStruct = {
    name: ethers.utils.formatBytes32String(referrer?.name ? referrer?.name + `.` + domainName : ''),
    domainName: ethers.utils.formatBytes32String(domainName),
    id: ethers.utils.formatBytes32String(''),
    wallet: ethers.constants.AddressZero,
    targetDomain: ethers.utils.formatBytes32String(referrerDomain ?? ''),
  };
  let referrerSignature = ethers.constants.HashZero;
  const proofOfReferrer: ReferrerMessage = {
    referrerAddress: referrer?.wallet.address ?? ethers.constants.AddressZero,
  };
  if (referrer?.wallet.address) {
    referrerSignature = await signReferralCode(proofOfReferrer, multipassAddress, referrer);
  }

  return {
    registrarMessage,
    validSignature,
    applicantData,
    referrerData,
    referrerSignature,
  };
};
export const signRegistrarMessage = async (
  message: RegisterMessage,
  verifierAddress: string,
  signer: SignerIdentity,
) => {
  let { chainId } = await ethers.provider.getNetwork();

  const multipassJs = new MultipassJs({
    chainId: chainId,
    contractName: MULTIPASS_CONTRACT_NAME,
    version: MULTIPASS_CONTRACT_VERSION,
    ...hre.network,
  });
  return await multipassJs.signRegistrarMessage(message, verifierAddress, signer.wallet);
};

const getSuperInterface = () => {
  let mergedArray: JsonFragment[] = [];
  function readDirectory(directory: string) {
    const files = fs.readdirSync(directory);

    files.forEach(file => {
      const fullPath = path.join(directory, file);
      if (fs.statSync(fullPath).isDirectory()) {
        readDirectory(fullPath); // Recurse into subdirectories
      } else if (path.extname(file) === '.json') {
        const fileContents = require('../' + fullPath); // Load the JSON file
        if (Array.isArray(fileContents)) {
          mergedArray = mergedArray.concat(fileContents); // Merge the array from the JSON file
        }
      }
    });
  }
  const originalConsoleLog = console.log;
  readDirectory('./abi');
  console.log = () => {}; // avoid noisy output
  const result = new ethers.utils.Interface(mergedArray);
  console.log = originalConsoleLog;
  return result;
};

export default {
  setupAddresses,
  setupEnvironment,
  addPlayerNameId,
  baseFee,
  signMessage: signRegistrarMessage,
  getSuperInterface,
};
