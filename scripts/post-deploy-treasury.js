const hre = require("hardhat");
const fs = require("fs");
require("dotenv").config();

function loadAddresses() {
  if (!fs.existsSync("deploy-addresses.json")) {
    throw new Error("deploy-addresses.json not found; deploy the contracts first");
  }

  const addresses = JSON.parse(fs.readFileSync("deploy-addresses.json", "utf8"));
  for (const key of ["token", "staking", "ico"]) {
    if (!addresses[key] || !hre.ethers.isAddress(addresses[key])) {
      throw new Error(`A valid ${key} address is required in deploy-addresses.json`);
    }
  }

  return addresses;
}

function requiredAddress(name) {
  const value = process.env[name];
  if (!value || !hre.ethers.isAddress(value)) {
    throw new Error(`${name} must be a valid address`);
  }
  return value;
}

function requiredPositiveAmount(name, fallback) {
  const value = process.env[name] || fallback;
  try {
    const amount = hre.ethers.parseEther(value);
    if (amount <= 0n) throw new Error();
    return amount;
  } catch {
    throw new Error(`${name} must be a positive decimal VSC amount`);
  }
}

async function requireContract(address, name) {
  const code = await hre.ethers.provider.getCode(address);
  if (code === "0x") {
    throw new Error(`${name} address ${address} has no contract code on Sepolia`);
  }
}

async function main() {
  if (hre.network.name !== "sepolia") {
    throw new Error(`Refusing to run on ${hre.network.name}; use --network sepolia`);
  }

  const addresses = loadAddresses();
  const configuredTreasury = requiredAddress("TREASURY_ADDRESS");
  const [treasury] = await hre.ethers.getSigners();

  if (configuredTreasury.toLowerCase() !== treasury.address.toLowerCase()) {
    throw new Error(
      `Signer ${treasury.address} does not match TREASURY_ADDRESS ${configuredTreasury}`
    );
  }

  await Promise.all([
    requireContract(addresses.token, "Token"),
    requireContract(addresses.staking, "Staking"),
    requireContract(addresses.ico, "ICO"),
  ]);

  const stakingAmount = requiredPositiveAmount("STAKING_FUND_AMOUNT", "1000000");
  const icoAmount = requiredPositiveAmount("ICO_SALE_AMOUNT", "5000000");
  const token = await hre.ethers.getContractAt("VistacionToken", addresses.token, treasury);

  console.log(`Treasury: ${treasury.address}`);
  console.log(`Token: ${addresses.token}`);
  console.log(`Staking funding target: ${hre.ethers.formatEther(stakingAmount)} VSC`);
  console.log(`ICO allowance target: ${hre.ethers.formatEther(icoAmount)} VSC`);

  let stakingBalance = await token.balanceOf(addresses.staking);
  let allowance = await token.allowance(treasury.address, addresses.ico);
  console.log(`Staking balance before: ${hre.ethers.formatEther(stakingBalance)} VSC`);
  console.log(`ICO allowance before: ${hre.ethers.formatEther(allowance)} VSC`);

  // VistacionToken burns a transfer fee, so verify after each transfer and top up
  // again if necessary rather than assuming the requested amount arrives intact.
  let attempts = 0;
  while (stakingBalance < stakingAmount && attempts < 3) {
    const shortfall = stakingAmount - stakingBalance;
    const transfer = await token.transfer(addresses.staking, shortfall);
    console.log(`Funding Staking (attempt ${attempts + 1}): ${transfer.hash}`);
    await transfer.wait();
    stakingBalance = await token.balanceOf(addresses.staking);
    attempts += 1;
  }

  if (stakingBalance < stakingAmount) {
    throw new Error("Unable to reach the requested Staking balance after three transfers");
  }

  if (allowance < icoAmount) {
    const approval = await token.approve(addresses.ico, icoAmount);
    console.log(`Approving ICO: ${approval.hash}`);
    await approval.wait();
    allowance = await token.allowance(treasury.address, addresses.ico);
  } else {
    console.log("ICO already has the requested allowance; no approval needed.");
  }

  const stakingAfter = await token.balanceOf(addresses.staking);
  const allowanceAfter = await token.allowance(treasury.address, addresses.ico);
  console.log(`Staking balance after: ${hre.ethers.formatEther(stakingAfter)} VSC`);
  console.log(`ICO allowance after: ${hre.ethers.formatEther(allowanceAfter)} VSC`);

  if (stakingAfter < stakingAmount || allowanceAfter < icoAmount) {
    throw new Error("Post-deployment treasury verification failed");
  }

  console.log("Post-deployment treasury setup completed successfully.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
