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
 
const balance = await token.balanceOf(addresses.ico);
 
console.log(
"ICO Balance:",
hre.ethers.formatEther(balance),
"VSC"
);
}
 
main().catch((error) => {
console.error(error);
process.exitCode = 1;
});