const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const treasury = process.env.TREASURY_ADDRESS || deployer.address;
  const Token = await hre.ethers.getContractFactory("VistacionToken");
  const token = await Token.deploy(treasury, 50); // 0.50%, expressed in basis points
  await token.waitForDeployment();
  console.log(`VistacionToken deployed to: ${await token.getAddress()}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
