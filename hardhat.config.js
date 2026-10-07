require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

const { SEPOLIA_RPC_URL, DEPLOYER_PRIVATE_KEY, PRIVATE_KEY } = process.env;
const deployerKey = DEPLOYER_PRIVATE_KEY || PRIVATE_KEY;
const hasValidPrivateKey = (key) => typeof key === "string" && /^0x[0-9a-fA-F]{64}$/.test(key.trim());
const sepoliaAccounts = hasValidPrivateKey(deployerKey) ? [deployerKey.trim()] : [];

module.exports = {
  solidity: "0.8.24",
  networks: {
    hardhat: {},
    sepolia: {
      url: SEPOLIA_RPC_URL || "",
      accounts: sepoliaAccounts,
    },
  },
};
