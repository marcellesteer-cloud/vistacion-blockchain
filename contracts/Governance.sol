// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Governance is Ownable {
    IERC20 public immutable token;
    struct Proposal { string description; uint256 endTime; uint256 forVotes; uint256 againstVotes; bool executed; }
    Proposal[] public proposals;
    mapping(uint256 => mapping(address => bool)) public voted;
    constructor(address token_) Ownable(msg.sender) { require(token_ != address(0), "token is zero"); token = IERC20(token_); }
    function createProposal(string calldata description, uint256 duration) external returns (uint256 id) { require(token.balanceOf(msg.sender) > 0, "no voting power"); require(duration > 0, "zero duration"); id = proposals.length; proposals.push(Proposal(description, block.timestamp + duration, 0, 0, false)); }
    function vote(uint256 id, bool support) external { Proposal storage p = proposals[id]; require(block.timestamp < p.endTime, "ended"); require(!voted[id][msg.sender], "already voted"); uint256 weight = token.balanceOf(msg.sender); require(weight > 0, "no voting power"); voted[id][msg.sender] = true; if (support) p.forVotes += weight; else p.againstVotes += weight; }
    function execute(uint256 id) external { Proposal storage p = proposals[id]; require(block.timestamp >= p.endTime, "still active"); require(!p.executed, "executed"); require(p.forVotes > p.againstVotes, "not approved"); p.executed = true; }
}
