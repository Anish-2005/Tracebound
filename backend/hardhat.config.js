import { defineConfig } from "hardhat/config";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import "dotenv/config";

const accounts = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [];

export default defineConfig({
  solidity: "0.8.20",
  plugins: [hardhatEthers],
  networks: {
    sepolia: {
      type: "http",
      url: process.env.RPC_URL,
      accounts,
    },
  },
});