const hre = require("hardhat");
const { saveAddress } = require("./deployment-registry");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) throw new Error("No deployer signer configured for this network");
  const treasury = process.env.TREASURY_ADDRESS || deployer.address;
  if (!hre.ethers.isAddress(treasury) || treasury === hre.ethers.ZeroAddress) {
    throw new Error("TREASURY_ADDRESS must be a valid nonzero address");
  }
  const burnBasisPoints = 50; // 0.50%

  console.log("Deploying token with:", deployer.address);
  const Token = await hre.ethers.getContractFactory("VistacionToken");
  const token = await Token.deploy(treasury, burnBasisPoints);
  await token.waitForDeployment();

  const address = await token.getAddress();
  saveAddress(hre, "token", address, ["staking", "escrow", "governance", "ico"]);
  console.log("VistacionToken deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
