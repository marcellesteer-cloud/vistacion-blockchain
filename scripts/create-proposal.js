const hre = require("hardhat");
const fs = require("fs");
 
async function main() {
const addresses = JSON.parse(
fs.readFileSync("deploy-addresses.json", "utf8")
);
 
const governance = await hre.ethers.getContractAt(
"Governance",
addresses.governance
);
 
const tx = await governance.createProposal(
"Test Proposal #1",
300
);
 
console.log("Create proposal tx:", tx.hash);
 
await tx.wait();
 
console.log("Proposal created successfully");
}
 
main().catch((error) => {
console.error(error);
process.exitCode = 1;
});