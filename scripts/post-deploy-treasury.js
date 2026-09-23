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

async function main() {
  if (hre.network.name !== "sepolia") {
    throw new Error(`Refusing to run on ${hre.network.name}; use --network sepolia`);
  }

  const addresses = loadAddresses();
  const [treasury] = await hre.ethers.getSigners();
  const configuredTreasury = process.env.TREASURY_ADDRESS;

  if (configuredTreasury && hre.ethers.isAddress(configuredTreasury)
      && configuredTreasury.toLowerCase() !== treasury.address.toLowerCase()) {
    throw new Error(
      `Signer ${treasury.address} does not match TREASURY_ADDRESS ${configuredTreasury}`
    );
  }

  const stakingAmount = requiredPositiveAmount("STAKING_FUND_AMOUNT", "1000000");
  const icoAmount = requiredPositiveAmount("ICO_SALE_AMOUNT", "5000000");
  const token = await hre.ethers.getContractAt("VistacionToken", addresses.token, treasury);

  console.log(`Treasury: ${treasury.address}`);
  console.log(`Token: ${addresses.token}`);
  console.log(`Staking funding: ${hre.ethers.formatEther(stakingAmount)} VSC`);
  console.log(`ICO allowance: ${hre.ethers.formatEther(icoAmount)} VSC`);

  const stakingBefore = await token.balanceOf(addresses.staking);
  const allowanceBefore = await token.allowance(treasury.address, addresses.ico);
  console.log(`Staking balance before: ${hre.ethers.formatEther(stakingBefore)} VSC`);
  console.log(`ICO allowance before: ${hre.ethers.formatEther(allowanceBefore)} VSC`);

  if (stakingBefore < stakingAmount) {
    const transfer = await token.transfer(addresses.staking, stakingAmount - stakingBefore);
    console.log(`Funding Staking: ${transfer.hash}`);
    await transfer.wait();
  } else {
    console.log("Staking already has the requested balance; no transfer needed.");
  }

  if (allowanceBefore < icoAmount) {
    const approval = await token.approve(addresses.ico, icoAmount);
    console.log(`Approving ICO: ${approval.hash}`);
    await approval.wait();
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
