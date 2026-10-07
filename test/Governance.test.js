const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Governance", function () {
  let token;
  let governance;
  let treasury;
  let voter;
  let opposingVoter;
  let noPower;

  beforeEach(async function () {
    [treasury, voter, opposingVoter, noPower] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("VistacionToken");
    token = await Token.deploy(treasury.address, 0);
    await token.waitForDeployment();

    const Governance = await ethers.getContractFactory("Governance");
    governance = await Governance.deploy(await token.getAddress());
    await governance.waitForDeployment();

    await token.transfer(voter.address, ethers.parseEther("100"));
    await token.transfer(opposingVoter.address, ethers.parseEther("40"));
  });

  it("records token-weighted votes and executes an approved proposal after voting ends", async function () {
    const duration = 3600;
    await governance.connect(voter).createProposal("Fund community grants", duration);
    await governance.connect(voter).vote(0, true);
    await governance.connect(opposingVoter).vote(0, false);

    const proposal = await governance.proposals(0);
    expect(proposal.forVotes).to.equal(ethers.parseEther("100"));
    expect(proposal.againstVotes).to.equal(ethers.parseEther("40"));
    await expect(governance.connect(voter).vote(0, true)).to.be.revertedWith("already voted");
    await expect(governance.execute(0)).to.be.revertedWith("still active");

    await time.increaseTo(proposal.endTime);
    await governance.execute(0);
    expect((await governance.proposals(0)).executed).to.equal(true);
  });

  it("requires voting power to create a proposal", async function () {
    await expect(governance.connect(noPower).createProposal("No voting power", 3600))
      .to.be.revertedWith("no voting power");
  });
});
