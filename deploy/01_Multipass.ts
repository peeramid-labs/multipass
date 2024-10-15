import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { MULTIPASS_CONTRACT_VERSION, MULTIPASS_CONTRACT_NAME } from '../test/utils';
import { getProcessEnv } from '../scripts/libraries/utils';
import { ethers } from 'hardhat';
import { Multipass } from '../types';
// import { MultipassDiamond } from '../types';
const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { diamond, deploy } = deployments;
  const { deployer, owner } = await getNamedAccounts();
  const deployment = await deploy('Multipass', {
    from: deployer,
    proxy: {
      execute: {
        init: {
          methodName: 'initialize',
          args:
            process.env.NODE_ENV === 'TEST'
              ? [MULTIPASS_CONTRACT_NAME, MULTIPASS_CONTRACT_VERSION, owner]
              : [
                  getProcessEnv(false, 'MULTIPASS_CONTRACT_NAME'),
                  getProcessEnv(false, 'MULTIPASS_CONTRACT_VERSION'),
                  owner,
                ],
        },
      },
      proxyContract: 'OpenZeppelinTransparentProxy',
    },

    log: true,
    autoMine: true,
  });

  //   const deployment = await diamond.deploy('Multipass', {
  //     from: deployer,
  //     owner: deployer,
  //     log: true,
  //     facets: ['Multipass', 'EIP712InspectorFacet', 'MultipassInit'],
  //     execute: {
  //       methodName: 'init',
  //       args:
  //         process.env.NODE_ENV === 'TEST'
  //           ? [MULTIPASS_CONTRACT_NAME, MULTIPASS_CONTRACT_VERSION]
  //           : [getProcessEnv(false, 'MULTIPASS_CONTRACT_NAME'), getProcessEnv(false, 'MULTIPASS_CONTRACT_VERSION')],
  //     },
  //   });
//   const multipass = (await ethers.getContractAt(deployment.abi, deployment.address)) as Multipass;
//   await multipass.connect(await hre.ethers.getSigner(deployer)).transferOwnership(owner);
};

export default func;
func.tags = ['multipass'];
