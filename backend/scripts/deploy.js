import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();
  const IntentLedger = await ethers.getContractFactory("IntentLedger");
  const contract = await IntentLedger.deploy();
  await contract.waitForDeployment();
  console.log("IntentLedger deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
