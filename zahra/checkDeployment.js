import { ethers } from 'ethers';

async function verifyContractDeployment() {
  // RPC رسمی ZenChain Testnet
  const rpcUrl = "https://zenchain-testnet.api.onfinality.io/public";

  // آدرس قرارداد جدید
  const address = "0xF7C6DB53Dc3f4e92a12DA8590F4DE040B2820EE5";

  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

  try {
    const code = await provider.getCode(address);
    console.log("Contract code length:", code.length);

    if (code === "0x") {
      console.error("❌ No contract deployed at this address on ZenChain Testnet");
    } else {
      console.log("✅ Contract is deployed at:", address);
    }
  } catch (err) {
    console.error("RPC or network error:", err);
  }
}

verifyContractDeployment();
