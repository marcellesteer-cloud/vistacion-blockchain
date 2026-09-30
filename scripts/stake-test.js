const hre = require("hardhat");
const fs = require("fs");
 
async function main() {
const addresses = JSON.parse(
fs.readFileSync("deploy-addresses.json", "utf8")
);
 
const staking = await hre.ethers.getContractAt(
"Staking",
addresses.staking
);
 
const amount = hre.ethers.parseEther("10");
 
const tx = await staking.stake(amount);
console.log("Stake tx:", tx.hash);
 
await tx.wait();
 
console.log("Successfully staked 10 VSC");
}
 
main().catch((error) => {
console.error(error);
process.exitCode = 1;
});