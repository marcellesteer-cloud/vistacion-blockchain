const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Escrow", function () {
  let token;
  let escrow;
  let treasury;
  let buyer;
  let seller;
  let oracle;
  let other;
  const amount = ethers.parseEther("100");

  beforeEach(async function () {
    [treasury, buyer, seller, oracle, other] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("VistacionToken");
    token = await Token.deploy(treasury.address, 50);
    await token.waitForDeployment();

    const Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy(await token.getAddress(), oracle.address);
    await escrow.waitForDeployment();

    await token.transfer(buyer.address, amount * 2n);
    await token.connect(buyer).approve(await escrow.getAddress(), amount * 2n);
  });

  it("creates a deal and holds the buyer's tokens in escrow", async function () {
    const receivedAmount = amount * 9_950n / 10_000n;

    await expect(escrow.connect(buyer).createEscrow(seller.address, amount))
      .to.changeTokenBalances(token, [buyer, escrow], [-amount, receivedAmount]);

    const deal = await escrow.deals(0);
    expect(deal.buyer).to.equal(buyer.address);
    expect(deal.seller).to.equal(seller.address);
    expect(deal.amount).to.equal(receivedAmount);
    expect(deal.docsSubmitted).to.equal(false);
    expect(deal.resolved).to.equal(false);
    expect(await escrow.nextId()).to.equal(1);
  });

  it("rejects deals with a zero seller or zero amount", async function () {
    await expect(escrow.connect(buyer).createEscrow(ethers.ZeroAddress, amount))
      .to.be.revertedWith("invalid deal");
    await expect(escrow.connect(buyer).createEscrow(seller.address, 0))
      .to.be.revertedWith("invalid deal");
    expect(await escrow.nextId()).to.equal(0);
  });

  it("accepts document submission only from the seller", async function () {
    await escrow.connect(buyer).createEscrow(seller.address, amount);

    await expect(escrow.connect(other).submitDocs(0)).to.be.revertedWith("not seller");
    await escrow.connect(seller).submitDocs(0);
    expect((await escrow.deals(0)).docsSubmitted).to.equal(true);
  });

  it("releases funds to the seller after oracle approval", async function () {
    await escrow.connect(buyer).createEscrow(seller.address, amount);
    await escrow.connect(seller).submitDocs(0);
    const receivedAmount = amount * 9_950n / 10_000n;
    const sellerAmount = receivedAmount * 9_950n / 10_000n;

    await expect(escrow.connect(oracle).verifyAndRelease(0, true))
      .to.changeTokenBalances(token, [escrow, seller], [-receivedAmount, sellerAmount]);

    expect((await escrow.deals(0)).resolved).to.equal(true);
  });

  it("refunds the buyer when the oracle rejects the submitted documents", async function () {
    await escrow.connect(buyer).createEscrow(seller.address, amount);
    await escrow.connect(seller).submitDocs(0);
    const receivedAmount = amount * 9_950n / 10_000n;
    const refundAmount = receivedAmount * 9_950n / 10_000n;

    await expect(escrow.connect(oracle).verifyAndRelease(0, false))
      .to.changeTokenBalances(token, [escrow, buyer], [-receivedAmount, refundAmount]);

    expect((await escrow.deals(0)).resolved).to.equal(true);
  });

  it("requires the oracle and submitted documents before resolution", async function () {
    await escrow.connect(buyer).createEscrow(seller.address, amount);

    await expect(escrow.connect(other).verifyAndRelease(0, true))
      .to.be.revertedWith("not oracle");
    await expect(escrow.connect(oracle).verifyAndRelease(0, true))
      .to.be.revertedWith("not ready");
  });

  it("prevents submitting documents or resolving a deal more than once", async function () {
    await escrow.connect(buyer).createEscrow(seller.address, amount);
    await escrow.connect(seller).submitDocs(0);
    await escrow.connect(oracle).verifyAndRelease(0, true);

    await expect(escrow.connect(seller).submitDocs(0)).to.be.revertedWith("resolved");
    await expect(escrow.connect(oracle).verifyAndRelease(0, true))
      .to.be.revertedWith("not ready");
  });

  it("allows only the owner to set a nonzero oracle", async function () {
    await expect(escrow.connect(other).setOracle(other.address))
      .to.be.revertedWithCustomError(escrow, "OwnableUnauthorizedAccount");
    await expect(escrow.setOracle(ethers.ZeroAddress)).to.be.revertedWith("zero oracle");

    await escrow.setOracle(other.address);
    expect(await escrow.oracle()).to.equal(other.address);
  });
});
