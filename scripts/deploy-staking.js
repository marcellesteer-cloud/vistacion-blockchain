const hre = require("hardhat");
const { loadAddresses, requireDeployedContract, saveAddress } = require("./deployment-registry");

async function main() {
  const { token } = loadAddresses(hre);
  await requireDeployedContract(hre, token, "Token");

  const Staking = await hre.ethers.getContractFactory("Staking");
  const staking = await Staking.deploy(token, 500); // 5.00% APR in basis points
  await staking.waitForDeployment();

  const address = await staking.getAddress();
  saveAddress(hre, "staking", address);
  console.log("Staking deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
