require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

const { SEPOLIA_RPC_URL, DEPLOYER_PRIVATE_KEY, PRIVATE_KEY } = process.env;
const deployerKey = DEPLOYER_PRIVATE_KEY || PRIVATE_KEY;

module.exports = {
  solidity: "0.8.24",
  networks: {
    hardhat: {},
    sepolia: {
      url: SEPOLIA_RPC_URL || "",
      accounts: deployerKey ? [deployerKey] : [],
    },
  },
};
