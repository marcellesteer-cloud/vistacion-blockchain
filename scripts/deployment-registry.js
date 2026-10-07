const fs = require("fs");

const REGISTRY_PATH = "deploy-addresses.json";

function loadAddresses(hre) {
  if (!fs.existsSync(REGISTRY_PATH)) {
    throw new Error(`${REGISTRY_PATH} not found; deploy the token first`);
  }

  const addresses = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
  if (addresses.network !== hre.network.name) {
    throw new Error(
      `Address registry targets ${addresses.network || "an unknown network"}, not ${hre.network.name}`
    );
  }
  return addresses;
}

async function requireDeployedContract(hre, address, name) {
  if (!address || !hre.ethers.isAddress(address) || address === hre.ethers.ZeroAddress) {
    throw new Error(`A valid ${name} address is required in ${REGISTRY_PATH}`);
  }

  const code = await hre.ethers.provider.getCode(address);
  if (code === "0x") {
    throw new Error(`${name} address ${address} has no contract code on ${hre.network.name}`);
  }
}

function saveAddress(hre, key, address, invalidate = []) {
  const data = fs.existsSync(REGISTRY_PATH)
    ? JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"))
    : {};
  data.network = hre.network.name;
  data[key] = address;
  for (const dependentKey of invalidate) {
    delete data[dependentKey];
  }
  fs.writeFileSync(REGISTRY_PATH, `${JSON.stringify(data, null, 2)}\n`);
}

module.exports = { loadAddresses, requireDeployedContract, saveAddress };
