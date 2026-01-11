import hre from "hardhat";

async function main() {
  const client = await hre.viem.getWalletClient();
  console.log(client.account.address);
}

main().catch(console.error);
