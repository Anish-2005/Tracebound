import { ethers } from "hardhat";

async function main() {
  const IntentLedger = await ethers.getContractFactory("IntentLedger");
  const contract = await IntentLedger.deploy();
  await contract.deployed();
  console.log("IntentLedger deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
