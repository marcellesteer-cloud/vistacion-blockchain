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
 
const tx = await staking.claim();
 
console.log("Claim tx:", tx.hash);
 
await tx.wait();
 
console.log("Successfully claimed rewards");
}
 
main().catch((error) => {
console.error(error);
process.exitCode = 1;
});
