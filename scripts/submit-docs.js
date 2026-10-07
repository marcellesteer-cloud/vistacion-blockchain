const hre = require("hardhat");
const fs = require("fs");
 
async function main() {
const addresses = JSON.parse(
fs.readFileSync("deploy-addresses.json", "utf8")
);
 
const escrow = await hre.ethers.getContractAt(
"Escrow",
addresses.escrow
);
 
const tx = await escrow.submitDocs(0);
 
console.log("Submit docs tx:", tx.hash);
 
await tx.wait();
 
console.log("Documents submitted successfully");
}
 
main().catch((error) => {
console.error(error);
process.exitCode = 1;
});