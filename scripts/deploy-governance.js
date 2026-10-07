const hre = require("hardhat");
const { loadAddresses, requireDeployedContract, saveAddress } = require("./deployment-registry");

async function main() {
  const { token } = loadAddresses(hre);
  await requireDeployedContract(hre, token, "Token");

  const Governance = await hre.ethers.getContractFactory("Governance");
  const governance = await Governance.deploy(token);
  await governance.waitForDeployment();

  const address = await governance.getAddress();
  saveAddress(hre, "governance", address);
  console.log("Governance deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
