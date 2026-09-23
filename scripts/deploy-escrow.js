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
  const oracle = process.env.ORACLE_ADDRESS;
  if (!token) throw new Error("Token address is missing; deploy the token first");
  if (!oracle || oracle === "0x0000000000000000000000000000000000000000") {
    throw new Error("ORACLE_ADDRESS must be configured");
  }

  const Escrow = await hre.ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy(token, oracle);
  await escrow.waitForDeployment();

  const address = await escrow.getAddress();
  saveAddress("escrow", address);
  console.log("Escrow deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
