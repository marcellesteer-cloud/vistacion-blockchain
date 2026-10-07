const hre = require("hardhat");
const fs = require("fs");
 
async function main() {
const addresses = JSON.parse(
fs.readFileSync("deploy-addresses.json", "utf8")
);
 
const [account] = await hre.ethers.getSigners();
 
const staking = await hre.ethers.getContractAt(
"Staking",
addresses.staking
);
 
const rewards = await staking.pendingRewards(account.address);
 
console.log("Wallet:", account.address);
console.log(
"Pending Rewards:",
hre.ethers.formatEther(rewards),
"VSC"
);
}
 
main().catch((error) => {
console.error(error);
process.exitCode = 1;
});