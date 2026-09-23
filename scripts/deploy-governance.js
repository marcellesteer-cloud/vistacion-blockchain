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

  const Governance = await hre.ethers.getContractFactory("Governance");
  const governance = await Governance.deploy(token);
  await governance.waitForDeployment();

  const address = await governance.getAddress();
  saveAddress("governance", address);
  console.log("Governance deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
