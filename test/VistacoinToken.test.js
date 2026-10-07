const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VistacionToken", function () {
  let token;
  let owner;
  let treasury;
  let recipient;

  beforeEach(async function () {
    [owner, treasury, recipient] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("VistacionToken");
    token = await Token.deploy(treasury.address, 50);
    await token.waitForDeployment();
  });

  it("mints the fixed supply to the treasury and applies the configured burn", async function () {
    const amount = ethers.parseEther("100");

    expect(await token.totalSupply()).to.equal(ethers.parseEther("21000000"));
    expect(await token.balanceOf(treasury.address)).to.equal(await token.totalSupply());

    await token.connect(treasury).transfer(recipient.address, amount);

    expect(await token.balanceOf(recipient.address)).to.equal(ethers.parseEther("99.5"));
    expect(await token.totalSupply()).to.equal(ethers.parseEther("20999999.5"));
  });

  it("allows the admin to change the burn rate within the valid range", async function () {
    const Token = await ethers.getContractFactory("VistacionToken");
    await expect(Token.deploy(treasury.address, 10_000)).to.be.revertedWith("burn too high");
    await expect(token.setBurnBasisPoints(10_000)).to.be.revertedWith("burn too high");
    await expect(token.connect(recipient).setBurnBasisPoints(100))
      .to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount");

    await token.setBurnBasisPoints(100);
    expect(await token.burnBasisPoints()).to.equal(100);
  });

  it("blocks transfers while paused and to blacklisted accounts", async function () {
    await token.addToBlacklist(recipient.address);
    await expect(token.connect(treasury).transfer(recipient.address, 1))
      .to.be.revertedWith("recipient blacklisted");

    await token.removeFromBlacklist(recipient.address);
    await token.pause();
    await expect(token.connect(treasury).transfer(recipient.address, 1))
      .to.be.revertedWithCustomError(token, "EnforcedPause");
  });
});
