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
 
// Use your VSC Test Wallet as seller
const seller = "0xE988564eB380837776a673641857C5C008F71a83";
 
const amount = hre.ethers.parseEther("100");
 
const tx = await escrow.createEscrow(
seller,
amount
);
 
console.log("Create escrow tx:", tx.hash);
 
await tx.wait();
 
console.log("Escrow created successfully");
}
 
main().catch((error) => {
console.error(error);
process.exitCode = 1;
});