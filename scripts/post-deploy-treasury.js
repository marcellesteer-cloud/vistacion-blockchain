const hre = require("hardhat");
const fs = require("fs");
require("dotenv").config();
const { grossAmountForNet } = require("./transfer-fees");

function loadAddresses() {
  if (!fs.existsSync("deploy-addresses.json")) {
    throw new Error("deploy-addresses.json not found; deploy the contracts first");
  }

  const addresses = JSON.parse(fs.readFileSync("deploy-addresses.json", "utf8"));
  if (addresses.network !== hre.network.name) {
    throw new Error(
      `Address registry targets ${addresses.network || "an unknown network"}, not ${hre.network.name}`
    );
  }
  for (const key of ["token", "staking", "ico"]) {
    if (!addresses[key] || !hre.ethers.isAddress(addresses[key])) {
      throw new Error(`A valid ${key} address is required in deploy-addresses.json`);
    }
  }

  return addresses;
}

function requiredAddress(name) {
  const value = process.env[name];
  if (!value || !hre.ethers.isAddress(value) || value === hre.ethers.ZeroAddress) {
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
  if (!treasury) throw new Error("No treasury signer configured for Sepolia");

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
  const staking = await hre.ethers.getContractAt("Staking", addresses.staking, treasury);
  const burnBasisPoints = await token.burnBasisPoints();
  if (burnBasisPoints >= 10_000n) {
    throw new Error("Token burn rate must be below 10000 basis points to fund contracts");
  }

  console.log(`Treasury: ${treasury.address}`);
  console.log(`Token: ${addresses.token}`);
  console.log(`Token transfer burn: ${burnBasisPoints} bps`);
  console.log(`Staking reward reserve target: ${hre.ethers.formatEther(stakingAmount)} VSC`);
  console.log(`ICO inventory target: ${hre.ethers.formatEther(icoAmount)} VSC`);

  let rewardPool = await staking.rewardPool();
  console.log(`Staking reward reserve before: ${hre.ethers.formatEther(rewardPool)} VSC`);

  if (rewardPool < stakingAmount) {
    const shortfall = stakingAmount - rewardPool;
    const grossAmount = grossAmountForNet(shortfall, burnBasisPoints);
    const allowance = await token.allowance(treasury.address, addresses.staking);
    if (allowance < grossAmount) {
      const approval = await token.approve(addresses.staking, grossAmount);
      console.log(`Approving Staking reward funding: ${approval.hash}`);
      await approval.wait();
    }

    const funding = await staking.fundRewards(grossAmount);
    console.log(`Funding Staking rewards: ${funding.hash}`);
    await funding.wait();
    rewardPool = await staking.rewardPool();
  } else {
    console.log("Staking reward reserve already meets the target; no funding needed.");
  }

  let icoBalance = await token.balanceOf(addresses.ico);
  console.log(`ICO inventory before: ${hre.ethers.formatEther(icoBalance)} VSC`);
  if (icoBalance < icoAmount) {
    const grossAmount = grossAmountForNet(icoAmount - icoBalance, burnBasisPoints);
    const funding = await token.transfer(addresses.ico, grossAmount);
    console.log(`Funding ICO inventory: ${funding.hash}`);
    await funding.wait();
    icoBalance = await token.balanceOf(addresses.ico);
  } else {
    console.log("ICO inventory already meets the target; no funding needed.");
  }

  const stakingAfter = await staking.rewardPool();
  const icoAfter = await token.balanceOf(addresses.ico);
  console.log(`Staking reward reserve after: ${hre.ethers.formatEther(stakingAfter)} VSC`);
  console.log(`ICO inventory after: ${hre.ethers.formatEther(icoAfter)} VSC`);

  if (stakingAfter < stakingAmount || icoAfter < icoAmount) {
    throw new Error("Post-deployment treasury verification failed");
  }

  console.log("Post-deployment treasury setup completed successfully.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
