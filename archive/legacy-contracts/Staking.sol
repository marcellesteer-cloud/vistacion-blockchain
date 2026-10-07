// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Staking is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    IERC20 public immutable token;
    uint256 public aprBps;
    uint256 public constant YEAR = 365 days;
    struct Position { uint256 amount; uint256 updatedAt; uint256 rewards; }
    mapping(address => Position) public positions;

    constructor(address token_, uint256 aprBps_) Ownable(msg.sender) {
        require(token_ != address(0), "token is zero");
        token = IERC20(token_);
        aprBps = aprBps_;
    }

    function setApr(uint256 newAprBps) external onlyOwner { require(newAprBps <= 10_000, "APR too high"); _accrue(msg.sender); aprBps = newAprBps; }
    function stake(uint256 amount) external nonReentrant { require(amount > 0, "zero amount"); _accrue(msg.sender); positions[msg.sender].amount += amount; token.safeTransferFrom(msg.sender, address(this), amount); }
    function claim() external nonReentrant { _accrue(msg.sender); uint256 reward = positions[msg.sender].rewards; require(reward > 0, "no rewards"); positions[msg.sender].rewards = 0; token.safeTransfer(msg.sender, reward); }
    function unstake(uint256 amount) external nonReentrant { _accrue(msg.sender); require(amount > 0 && amount <= positions[msg.sender].amount, "invalid amount"); positions[msg.sender].amount -= amount; token.safeTransfer(msg.sender, amount); }
    function pendingRewards(address account) external view returns (uint256) { Position memory p = positions[account]; return p.rewards + (p.amount * aprBps * (block.timestamp - p.updatedAt) / YEAR / 10_000); }
    function _accrue(address account) internal { Position storage p = positions[account]; if (p.updatedAt != 0) p.rewards += p.amount * aprBps * (block.timestamp - p.updatedAt) / YEAR / 10_000; p.updatedAt = block.timestamp; }
}
