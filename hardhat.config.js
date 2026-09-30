require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
 
const deployerKey = process.env.DEPLOYER_PRIVATE;
 
module.exports = {
solidity: "0.8.24",
networks: {
hardhat: {},
sepolia: {
url: process.env.SEPOLIA_RPC_URL || "",
accounts: deployerKey ? [deployerKey] : [],
},
},
};