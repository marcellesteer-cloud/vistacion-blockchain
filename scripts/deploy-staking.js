const hre = require("hardhat");
const fs = require("fs");

function loadAddresses() {
  if (!fs.existsSync("deploy-addresses.json")) {
    throw new Error("deploy-addresses.json not found; deploy the token first");
  }
  return JSON.parse(fs.readFileSync("deploy-addresses.json", "utf8"));
}

function saveAddress(key, address) {
  const data = loadAddresses();
  data.network = hre.network.name;
  data[key] = address;
  fs.writeFileSync("deploy-addresses.json", `${JSON.stringify(data, null, 2)}\n`);
}

async function main() {
  const { token } = loadAddresses();
  if (!token) throw new Error("Token address is missing; deploy the token first");

  const Staking = await hre.ethers.getContractFactory("Staking");
  const staking = await Staking.deploy(token, 500); // 5.00% APR in basis points
  await staking.waitForDeployment();

  const address = await staking.getAddress();
  saveAddress("staking", address);
  console.log("Staking deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
