// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
 
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
 
contract VSCGovernance is AccessControl, Pausable {
 
bytes32 public constant GOVERNANCE_ADMIN_ROLE =
keccak256("GOVERNANCE_ADMIN_ROLE");
 
bytes32 public constant PAUSER_ROLE =
keccak256("PAUSER_ROLE");
 
uint256 public constant PROPOSAL_THRESHOLD =
100_000 ether;
 
uint256 public constant QUORUM_BPS = 2000; // 20%
 
IERC20 public immutable token;
 
enum ProposalType {
Operational,
Treasury,
Constitutional
}
 
struct Proposal {
string description;
ProposalType proposalType;
 
uint256 startTime;
uint256 endTime;
 
uint256 forVotes;
uint256 againstVotes;
 
bool executed;
}
 
Proposal[] public proposals;
 
mapping(uint256 => mapping(address => bool))
public voted;
 
event ProposalCreated(
uint256 indexed proposalId,
address indexed proposer,
ProposalType proposalType,
string description
);
 
event VoteCast(
uint256 indexed proposalId,
address indexed voter,
bool support,
uint256 weight
);
 
event ProposalExecuted(
uint256 indexed proposalId
);
 
constructor(address tokenAddress) {
require(
tokenAddress != address(0),
"token is zero"
);
 
token = IERC20(tokenAddress);
 
_grantRole(
DEFAULT_ADMIN_ROLE,
msg.sender
);
 
_grantRole(
GOVERNANCE_ADMIN_ROLE,
msg.sender
);
 
_grantRole(
PAUSER_ROLE,
msg.sender
);
}
 
function pause()
external
onlyRole(PAUSER_ROLE)
{
_pause();
}
 
function unpause()
external
onlyRole(PAUSER_ROLE)
{
_unpause();
}
 
function createProposal(
string calldata description,
ProposalType proposalType,
uint256 duration
)
external
whenNotPaused
returns (uint256 proposalId)
{
require(
token.balanceOf(msg.sender) >=
PROPOSAL_THRESHOLD,
"proposal threshold"
);
 
require(
duration > 0,
"invalid duration"
);
 
proposalId = proposals.length;
 
proposals.push(
Proposal({
description: description,
proposalType: proposalType,
 
startTime: block.timestamp,
endTime:
block.timestamp +
duration,
 
forVotes: 0,
againstVotes: 0,
 
executed: false
})
);
 
emit ProposalCreated(
proposalId,
msg.sender,
proposalType,
description
);
}
 
function vote(
uint256 proposalId,
bool support
)
external
whenNotPaused
{
Proposal storage proposal =
proposals[proposalId];
 
require(
block.timestamp <
proposal.endTime,
"voting ended"
);
 
require(
!voted[proposalId][msg.sender],
"already voted"
);
 
uint256 weight =
token.balanceOf(msg.sender);
 
require(
weight > 0,
"no voting power"
);
 
voted[proposalId][msg.sender] =
true;
 
if (support) {
proposal.forVotes += weight;
} else {
proposal.againstVotes += weight;
}
 
emit VoteCast(
proposalId,
msg.sender,
support,
weight
);
}
 
function execute(
uint256 proposalId
)
external
whenNotPaused
{
Proposal storage proposal =
proposals[proposalId];
 
require(
block.timestamp >=
proposal.endTime,
"still active"
);
 
require(
!proposal.executed,
"already executed"
);
 
uint256 totalVotes =
proposal.forVotes +
proposal.againstVotes;
 
uint256 quorumRequired =
(
token.totalSupply() *
QUORUM_BPS
) / 10000;
 
require(
totalVotes >=
quorumRequired,
"quorum not met"
);
 
uint256 approvalPercent =
(
proposal.forVotes *
10000
) / totalVotes;
 
if (
proposal.proposalType ==
ProposalType.Operational
) {
require(
approvalPercent >= 5100,
"operational fail"
);
}
 
if (
proposal.proposalType ==
ProposalType.Treasury
) {
require(
approvalPercent >= 6000,
"treasury fail"
);
}
 
if (
proposal.proposalType ==
ProposalType.Constitutional
) {
require(
approvalPercent >= 7500,
"constitutional fail"
);
}
 
proposal.executed = true;
 
emit ProposalExecuted(
proposalId
);
}
 
function proposalCount()
external
view
returns (uint256)
{
return proposals.length;
}
 
function getProposal(
uint256 proposalId
)
external
view
returns (
string memory description,
ProposalType proposalType,
uint256 startTime,
uint256 endTime,
uint256 forVotes,
uint256 againstVotes,
bool executed
)
{
Proposal memory proposal =
proposals[proposalId];
 
return (
proposal.description,
proposal.proposalType,
proposal.startTime,
proposal.endTime,
proposal