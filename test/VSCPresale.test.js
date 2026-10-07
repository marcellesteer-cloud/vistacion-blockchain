const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("VSCPresale", function () {
  let token;
  let presale;
  let treasury;
  let buyer;
  let start;
  let end;

  beforeEach(async function () {
    [treasury, buyer] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("VistacionToken");
    token = await Token.deploy(treasury.address, 0);
    await token.waitForDeployment();

    const now = await time.latest();
    start = now + 60;
    end = start + 3600;
    const price = ethers.parseEther("0.0005");

    const Presale = await ethers.getContractFactory("VSCPresale");
    presale = await Presale.deploy(
      await token.getAddress(),
      price,
      start,
      end,
      treasury.address
    );
    await presale.waitForDeployment();

    await token.transfer(await presale.getAddress(), ethers.parseEther("5000"));
  });

  it("sells tokens for ETH and forwards the payment to the treasury", async function () {
    const payment = ethers.parseEther("1");
    const expectedTokens = ethers.parseEther("2000");

    await expect(presale.connect(buyer).buy({ value: payment }))
      .to.be.revertedWith("sale inactive");

    await time.increaseTo(start);
    const treasuryBalanceBefore = await ethers.provider.getBalance(treasury.address);
    await presale.connect(buyer).buy({ value: payment });

    expect(await token.balanceOf(buyer.address)).to.equal(expectedTokens);
    expect(await token.balanceOf(await presale.getAddress())).to.equal(ethers.parseEther("3000"));
    expect(await ethers.provider.getBalance(treasury.address)).to.equal(treasuryBalanceBefore + payment);
  });

  it("restricts price changes to the owner and rejects a zero price", async function () {
    await expect(presale.setPrice(0)).to.be.revertedWith("zero price");
    await expect(presale.connect(buyer).setPrice(ethers.parseEther("0.001")))
      .to.be.revertedWithCustomError(presale, "OwnableUnauthorizedAccount");
  });
});
