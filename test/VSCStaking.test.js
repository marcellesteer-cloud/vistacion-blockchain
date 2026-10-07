const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Staking", function () {
  let token;
  let staking;
  let treasury;
  let staker;

  beforeEach(async function () {
    [treasury, staker] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("VistacionToken");
    token = await Token.deploy(treasury.address, 50);
    await token.waitForDeployment();

    const Staking = await ethers.getContractFactory("Staking");
    staking = await Staking.deploy(await token.getAddress(), 500);
    await staking.waitForDeployment();

    await token.transfer(staker.address, ethers.parseEther("1100"));
    await token.connect(staker).approve(await staking.getAddress(), ethers.parseEther("1000"));
  });

  it("accepts a stake, accrues rewards, pays rewards, and returns the principal", async function () {
    const principalRequested = ethers.parseEther("1000");
    const principalReceived = principalRequested * 9_950n / 10_000n;
    const reward = principalReceived * 500n / 10_000n;

    await staking.connect(staker).stake(principalRequested);
    expect((await staking.positions(staker.address)).amount).to.equal(principalReceived);
    expect(await staking.totalStaked()).to.equal(principalReceived);

    await time.increase(365 * 24 * 60 * 60);
    expect(await staking.pendingRewards(staker.address)).to.equal(reward);

    const rewardFunding = ethers.parseEther("60");
    await token.approve(await staking.getAddress(), rewardFunding);
    await staking.fundRewards(rewardFunding);
    expect(await staking.rewardPool()).to.equal(rewardFunding * 9_950n / 10_000n);

    const balanceBeforeClaim = await token.balanceOf(staker.address);
    const rewardPoolBeforeClaim = await staking.rewardPool();
    const claimTransaction = await staking.connect(staker).claim();
    const claimReceipt = await claimTransaction.wait();
    const claimEvent = claimReceipt.logs
      .map((log) => staking.interface.parseLog(log))
      .find((event) => event && event.name === "RewardsClaimed");
    const claimedReward = claimEvent.args.amount;
    const balanceAfterClaim = await token.balanceOf(staker.address);
    expect(rewardPoolBeforeClaim - await staking.rewardPool()).to.equal(claimedReward);
    expect(balanceAfterClaim - balanceBeforeClaim).to.equal(
      claimedReward - claimedReward * 50n / 10_000n
    );

    const balanceBeforeUnstake = await token.balanceOf(staker.address);
    await staking.connect(staker).unstake(principalReceived);
    expect((await staking.positions(staker.address)).amount).to.equal(0);
    expect(await staking.totalStaked()).to.equal(0);
    expect(await token.balanceOf(staker.address)).to.equal(
      balanceBeforeUnstake + principalReceived * 9_950n / 10_000n
    );
  });

  it("rejects zero stakes and withdrawals above the staked amount", async function () {
    await expect(staking.connect(staker).stake(0)).to.be.revertedWith("zero amount");
    await staking.connect(staker).stake(ethers.parseEther("1000"));
    await expect(staking.connect(staker).unstake(ethers.parseEther("1001")))
      .to.be.revertedWith("invalid amount");
    await expect(staking.setApr(600)).to.be.revertedWith("staking already started");
  });

  it("requires a funded reward reserve before paying accrued rewards", async function () {
    await staking.connect(staker).stake(ethers.parseEther("1000"));
    await time.increase(365 * 24 * 60 * 60);
    await expect(staking.connect(staker).claim()).to.be.revertedWith("insufficient rewards");
  });
});
