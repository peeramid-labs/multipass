import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { MultipassJs, RegisterMessage } from '../..//utils/multipass';
import { LibMultipass } from '../../types/src/Multipass';

export const signRegistrarMessage = async (
    message: LibMultipass.RecordStruct,
    verifierAddress: string,
    signer: SignerWithAddress,
    hre: any
  ) => {
    let { chainId } = await hre.ethers.provider.getNetwork();
    const multipassJs = new MultipassJs({
      chainId: chainId,
      contractName: 'MultipassDNS',
      version: '0.0.1',
      ...hre.network,
    });
    return await multipassJs.signRegistrarMessage(message as RegisterMessage, verifierAddress, signer);
  };