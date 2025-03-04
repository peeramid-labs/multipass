import 'solidity-coverage';
import { task } from 'hardhat/config';
import '@nomicfoundation/hardhat-chai-matchers';
import '@nomicfoundation/hardhat-toolbox';
import 'hardhat-abi-exporter';
import 'hardhat-gas-reporter';
import 'hardhat-contract-sizer';
import 'hardhat-deploy';
import 'solidity-docgen';
import './playbook';

task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

export default {
  docgen: {
    outputDir: './docs/contracts',
    pages: 'files',
    templates: 'docs/templates/src',
    sourcesDir: './src',
    pageExtension: '.md',
    exclude: ['mocks', 'initializers', 'vendor', 'modifiers', 'fixtures'],
  },
  gasReporter: {
    currency: 'EUR',
    gasPrice: 21,
    token: 'MATIC',
    gasPriceApi: 'https://api.polygonscan.com/api?module=proxy&action=eth_gasPrice',
    enabled: false,
    coinmarketcap: process.env.COINMARKETCAP_KEY,
  },
  namedAccounts: {
    deployer: {
      hardhat: '0xF52E5dF676f51E410c456CC34360cA6F27959420',
      anvil: '0x6Cf8d74C7875de8C2FfB09228F4bf2A21b25e583',
      default: '0xF52E5dF676f51E410c456CC34360cA6F27959420', //TODO this must be set for networks
      arbsepolia: '0x6Cf8d74C7875de8C2FfB09228F4bf2A21b25e583',
    },
    owner: {
      default: '0x520E00225C4a43B6c55474Db44a4a44199b4c3eE',
      anvil: '0x507c2d32185667156de5B4C440FEEf3800078bDb',
      arbsepolia: '0x6Cf8d74C7875de8C2FfB09228F4bf2A21b25e583',
    },
    registrar: {
      localhost: '0xaA63aA2D921F23f204B6Bcb43c2844Fb83c82eb9',
      arbsepolia: '0x98fBE64861B331674e195E1A0b2fA303324c83e1',
    },
    defaultPlayer: {
      localhost: '0xF52E5dF676f51E410c456CC34360cA6F27959420',
    },
  },
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      accounts: {
        mnemonic: 'casual vacant letter raw trend tool vacant opera buzz jaguar bridge myself',
      }, // ONLY LOCAL
    },
    mumbai: {
      url: 'https://matic-mumbai.chainstacklabs.com',
      accounts: process.env.PRIVATE_KEY && [process.env.PRIVATE_KEY],
    },
    arbsepolia: {
      name: 'arbitrum sepolia',
      url: process.env.ARB_SEPOLIA_RPC_URL ?? '',
      accounts: {
        mnemonic: process.env.ARB_SEPOLIA_MNEMONIC ?? 'x',
      },
      verify: {
        etherscan: {
          apiKey: process.env.ARB_SEPOLIA_ETHERSCAN_API_KEY ?? '',
          apiUrl: 'https://api-sepolia.arbiscan.io/',
        },
      },
    },
    localhost: {
      url: 'http://127.0.0.1:8545',
      accounts: {
        mnemonic: 'casual vacant letter raw trend tool vacant opera buzz jaguar bridge myself',
      }, // ONLY LOCAL
    },
    anvil: {
      url: process.env.ANVIL_RPC_URL ?? '',
      accounts: {
        mnemonic: process.env.ANVIL_MNEMONIC ?? 'x',
      },
    },
  },
  paths: {
    sources: './src',
  },
  solidity: {
    compilers: [
      {
        version: '0.8.28',
        settings: {
          optimizer: {
            enabled: true,
            runs: 2000,
          },
        },
      },
    ],
  },
  typechain: {
    outDir: 'types',
    target: 'ethers-v5',
    alwaysGenerateOverloads: true, // should overloads with full signatures like deposit(uint256) be generated always, even if there are no overloads?
  },

  abiExporter: {
    path: './abi',
    runOnCompile: true,
    clear: true,
    format: 'json',
    spacing: 2,
    pretty: false,
  },
};
