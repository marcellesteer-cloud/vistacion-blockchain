const hre = require("hardhat");
const fs = require("fs");

function saveAddress(key, address) {
  const path = "deploy-addresses.json";
  const data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, "utf8")) : {};
  data.network = hre.network.name;
  data[key] = address;
  fs.writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const treasury = process.env.TREASURY_ADDRESS || deployer.address;
  const burnBasisPoints = 50; // 0.50%

  console.log("Deploying token with:", deployer.address);
  const Token = await hre.ethers.getContractFactory("VistacionToken");
  const token = await Token.deploy(treasury, burnBasisPoints);
  await token.waitForDeployment();

  const address = await token.getAddress();
  saveAddress("token", address);
  console.log("VistacionToken deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
