const hre = require("hardhat");
const fs = require("fs");
 
async function main() {
const addresses = JSON.parse(
fs.readFileSync("deploy-addresses.json", "utf8")
);
 
const token = await hre.ethers.getContractAt(
"VistacionToken",
addresses.token
);
 
const amount = hre.ethers.parseEther("100");
 
const tx = await token.approve(
addresses.escrow,
amount
);
 
console.log("Approval tx:", tx.hash);
 
await tx.wait();
 
console.log("Approved 100 VSC for escrow");
}
 
main().catch((error) => {
console.error(error);
process.exitCode = 1;
});