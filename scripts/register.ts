const { ethers } = require("hardhat");

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

async function main() {
    console.log("Registering a new record");
    
    const [deployer] = await ethers.getSigners();

    const multipassDiamond = require(`../deployments/localhost/Multipass.json`) as any;
    const multipassDiamondAddress = multipassDiamond.address;
    const multipassDiamondAbi = multipassDiamond.abi;

    console.log("Deployer address:", deployer.address);

    const contract = new ethers.Contract(
        multipassDiamondAddress,
        multipassDiamondAbi,
        deployer
    );

    console.log("Contract address:", contract.address);

    const message = {
        wallet: '0xF52E5dF676f51E410c456CC34360cA6F27959420', 
        deadline: '0x6910e286', 
        domainName: '0x52616e6b6966792e697400000000000000000000000000000000000000000000', 
        id: "0x65396635343931652d663037652d343039332d623665382d6339313238393700", 
        name: '0x7468654b6f736d6f737300000000000000000000000000000000000000000000',
        nonce: '0x00'
    };

    const registrarSignature = "0x933ebb2d720914dd53fccf4278d12a40e156e57f4a56873c3d5d7ccbe09c9015092b81179f82b3c2daf8192732bc844c22583aafe4634c47910979e0233b2e461c";

    try {
        const tx = await contract.register(
            {
                domainName: message.domainName,
                id: message.id,
                name: message.name,
                wallet: message.wallet,
                nonce: message.nonce,
                validUntil: message.deadline,
            },
            registrarSignature,
            {
                name: ethers.utils.formatBytes32String(""),
                id: ethers.utils.formatBytes32String(""),
                domainName: ethers.utils.formatBytes32String(""),
                wallet: ethers.constants.AddressZero,
                targetDomain: ethers.utils.formatBytes32String(""),
            }, 
            ethers.constants.HashZero,
            { maxFeePerGas: 100000000000, maxPriorityFeePerGas: 1000000000, value: 0 }
        );
        console.log("Transaction hash:", tx.hash);
        await tx.wait();
        console.log("Transaction confirmed");
    } catch (e: any) {
        if (e.error?.data) {
            const decodedError = contract.interface.parseError(e.error.data);
            console.log(`Transaction failed with error: ${decodedError?.name}`);
            console.log(`Failed transaction args: ${decodedError?.args}`);
        } else {
            console.log(`Error:`, e);
        }
    }
}