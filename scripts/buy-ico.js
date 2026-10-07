const hre = require("hardhat");
const fs = require("fs");
 
async function main() {
const addresses = JSON.parse(
fs.readFileSync("deploy-addresses.json", "utf8")
);
 
const ico = await hre.ethers.getContractAt(
"ICO",
addresses.ico
);
 
const tx = await ico.buy({
value: hre.ethers.parseEther("0.001")
});
 
console.log("Purchase tx:", tx.hash);
 
await tx.wait();
 
console.log("ICO purchase completed successfully");
}
 
main().catch((error) => {
console.error(error);
process.exitCode = 1;
});