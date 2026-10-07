const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("VSCStaking", function () {
  let token;
  let staking;
  let treasury;
  let staker;

  beforeEach(async function () {
    [treasury, staker] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("VistacionToken");
    token = await Token.deploy(treasury.address, 0);
    await token.waitForDeployment();

    const Staking = await ethers.getContractFactory("VSCStaking");
    staking = await Staking.deploy(await token.getAddress());
    await staking.waitForDeployment();

    await token.transfer(staker.address, ethers.parseEther("1100"));
    await token.connect(staker).approve(await staking.getAddress(), ethers.parseEther("1000"));
  });

  it("accepts a stake, accrues rewards, pays rewards, and returns the principal", async function () {
    const principal = ethers.parseEther("1000");
    const reward = ethers.parseEther("50");

    await staking.connect(staker).stake(principal);
    expect((await staking.positions(staker.address)).amount).to.equal(principal);

    await time.increase(365 * 24 * 60 * 60);
    expect(await staking.pendingRewards(staker.address)).to.equal(reward);

    await token.transfer(await staking.getAddress(), ethers.parseEther("60"));
    const balanceBeforeClaim = await token.balanceOf(staker.address);
    await staking.connect(staker).claim();
    const balanceAfterClaim = await token.balanceOf(staker.address);
    expect(balanceAfterClaim).to.be.greaterThanOrEqual(balanceBeforeClaim + reward);

    await staking.connect(staker).unstake(principal);
    expect((await staking.positions(staker.address)).amount).to.equal(0);
    expect(await token.balanceOf(staker.address)).to.equal(balanceAfterClaim + principal);
  });

  it("rejects zero stakes and withdrawals above the staked amount", async function () {
    await expect(staking.connect(staker).stake(0)).to.be.revertedWith("zero amount");
    await staking.connect(staker).stake(ethers.parseEther("1000"));
    await expect(staking.connect(staker).unstake(ethers.parseEther("1001")))
      .to.be.revertedWith("invalid amount");
  });
});
