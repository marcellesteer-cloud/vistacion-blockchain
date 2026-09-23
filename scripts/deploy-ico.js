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
  const [deployer] = await hre.ethers.getSigners();
  const { token } = loadAddresses();
  const treasury = process.env.TREASURY_ADDRESS || deployer.address;
  if (!token) throw new Error("Token address is missing; deploy the token first");

  const priceWeiPerToken = hre.ethers.parseEther("0.0005");
  const start = Math.floor(Date.now() / 1000) + 3600;
  const end = start + 7 * 24 * 3600;

  const ICO = await hre.ethers.getContractFactory("ICO");
  const ico = await ICO.deploy(token, priceWeiPerToken, start, end, treasury);
  await ico.waitForDeployment();

  const address = await ico.getAddress();
  saveAddress("ico", address);
  console.log("ICO deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
