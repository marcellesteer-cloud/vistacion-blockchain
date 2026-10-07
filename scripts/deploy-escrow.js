const hre = require("hardhat");
const { loadAddresses, requireDeployedContract, saveAddress } = require("./deployment-registry");

async function main() {
  const { token } = loadAddresses(hre);
  const oracle = process.env.ORACLE_ADDRESS;
  await requireDeployedContract(hre, token, "Token");
  if (!oracle || !hre.ethers.isAddress(oracle) || oracle === hre.ethers.ZeroAddress) {
    throw new Error("ORACLE_ADDRESS must be configured as a nonzero address");
  }

  const Escrow = await hre.ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy(token, oracle);
  await escrow.waitForDeployment();

  const address = await escrow.getAddress();
  saveAddress(hre, "escrow", address);
  console.log("Escrow deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
