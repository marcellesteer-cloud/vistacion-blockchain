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
 
const tx = await governance.vote(
proposalId,
true
);
 
console.log("Vote tx:", tx.hash);
 
await tx.wait();
 
console.log("Vote submitted successfully");
}
 
main().catch((error) => {
console.error(error);
process.exitCode = 1;
});