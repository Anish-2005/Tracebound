import "@nomicfoundation/hardhat-ethers";
import "dotenv/config";

const accounts = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [];

/** @type import("hardhat/config").HardhatUserConfig */
const config = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      type: "http",
      url: process.env.RPC_URL,
      accounts,
    },
  },
};

export default config;