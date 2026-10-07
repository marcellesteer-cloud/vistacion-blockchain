const hre = require("hardhat");
const { loadAddresses, requireDeployedContract, saveAddress } = require("./deployment-registry");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) throw new Error("No deployer signer configured for this network");
  const { token } = loadAddresses(hre);
  const treasury = process.env.TREASURY_ADDRESS || deployer.address;
  await requireDeployedContract(hre, token, "Token");
  if (!hre.ethers.isAddress(treasury) || treasury === hre.ethers.ZeroAddress) {
    throw new Error("TREASURY_ADDRESS must be a valid nonzero address");
  }

  const priceWeiPerToken = hre.ethers.parseEther("0.0005");
  const latestBlock = await hre.ethers.provider.getBlock("latest");
  if (!latestBlock) throw new Error("Unable to read the latest block timestamp");
  const start = latestBlock.timestamp + 3600;
  const end = start + 7 * 24 * 3600;

  const ICO = await hre.ethers.getContractFactory("ICO");
  const ico = await ICO.deploy(token, priceWeiPerToken, start, end, treasury);
  await ico.waitForDeployment();

  const address = await ico.getAddress();
  saveAddress(hre, "ico", address);
  console.log("ICO deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
