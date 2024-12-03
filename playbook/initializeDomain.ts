import { task, types } from 'hardhat/config';
import { Multipass } from '../types';
import { LibMultipass } from '../types/src/Multipass';
import crypto from "crypto";
import { signRegistrarMessage } from "../playbook/utils/utils";

task('initializeDomain', 'Initialize domain name and activate it')
  .addOptionalParam('registrarAddress', 'Registrar address')
  .addOptionalParam('domain', 'Domain name to register', 'Rankify.it')
  .addOptionalParam('fee', 'Fee  amount in base currency of network', '0')
  .addOptionalParam('renewalFee', 'Renewal fee amount in base currency of network', '0')
  .addOptionalParam('reward', 'Referral share in base currency of network', '0')
  .addOptionalParam('discount', 'Discount in base currency of network', '0')
  .addOptionalParam('activate', 'Discount in base currency of network', true, types.boolean)
  .addOptionalParam('username', 'Username to associate with account', '')
  .addOptionalParam('useraddress', 'Player address whose username will be set')
  .setAction(
    async (
      {
        domain,
        fee,
        renewalFee,
        reward,
        discount,
        registrarAddress,
        activate,
        username,
        userAddress,
      }: { 
        domain: string; 
        fee: string; 
        renewalFee: string; 
        reward: string; 
        discount: string; 
        registrarAddress: string; 
        activate: boolean; 
        username: string; 
        userAddress: string; 
      },
      hre: any,
    ) => {
      const { deployments, getNamedAccounts } = hre;
      const { owner, registrar, defaultPlayer } = await getNamedAccounts();
      const multipassDeployment = await deployments.get('Multipass');
      const multipassContract = new hre.ethers.Contract(
        multipassDeployment.address,
        multipassDeployment.abi,
        hre.ethers.provider.getSigner(owner),
      ) as Multipass;

      registrarAddress = registrarAddress ?? registrar;
      const tx = await multipassContract.initializeDomain(
        registrarAddress,
        hre.ethers.utils.parseEther(fee),
        hre.ethers.utils.parseEther(renewalFee),
        hre.ethers.utils.formatBytes32String(domain),
        hre.ethers.utils.parseEther(reward),
        hre.ethers.utils.parseEther(discount),
      );
      console.log(await tx.wait(1));

      if (activate) {
        const tx = await multipassContract.activateDomain(hre.ethers.utils.formatBytes32String(domain));
        console.log(await tx.wait(1));
        console.log('Domain name "' + domain + '" successfully initialized and activated!');
      }

      if (username) {
        userAddress = userAddress ?? defaultPlayer;
        const playerId = crypto.randomUUID().slice(0, 31);

        const registrarMessage: LibMultipass.RecordStruct = {
          wallet: userAddress,
          name: hre.ethers.utils.formatBytes32String(username),
          id: hre.ethers.utils.formatBytes32String(playerId),
          domainName: hre.ethers.utils.formatBytes32String(domain),
          validUntil: ethers.BigNumber.from(Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60)),
          nonce: hre.ethers.BigNumber.from(0),
        };
        let signer = await hre.ethers.getSigner(registrar);

        
        const validSignature = await signRegistrarMessage(registrarMessage, multipassDeployment.address, signer, hre);

        const emptyUserQuery: LibMultipass.NameQueryStruct = {
          name: hre.ethers.utils.formatBytes32String(''),
          id: hre.ethers.utils.formatBytes32String(''),
          domainName: hre.ethers.utils.formatBytes32String(''),
          wallet: hre.ethers.constants.AddressZero,
          targetDomain: hre.ethers.utils.formatBytes32String(''),
        };
                    
        const tx = await multipassContract.register(
          registrarMessage,
          validSignature,
          emptyUserQuery,
          hre.ethers.constants.HashZero,
        );

        console.log('Username registered!');
      }
    },
  );

export default {};