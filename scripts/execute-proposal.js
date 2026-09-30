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
 
const proposalId = 0;
 
const tx = await governance.execute(proposalId);
 
console.log("Execute tx:", tx.hash);
 
await tx.wait();
 
console.log("Proposal executed successfully");
}
 
main().catch((error) => {
console.error(error);
process.exitCode = 1;
});