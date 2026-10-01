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
 
const amount = hre.ethers.parseEther("5000000");
 
const tx = await token.transfer(
addresses.ico,
amount
);
 
console.log("Funding tx:", tx.hash);
 
await tx.wait();
 
console.log("Successfully funded ICO with 5,000,000 VSC");
}
 
main().catch((error) => {
console.error(error);
process.exitCode = 1;
});