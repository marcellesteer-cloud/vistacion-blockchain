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
    uint256 public totalStaked;
    uint256 public rewardPool;
    bool public stakingStarted;

    struct Position {
        uint256 amount;
        uint256 updatedAt;
        uint256 rewards;
    }

    mapping(address => Position) public positions;

    event Staked(address indexed user, uint256 requestedAmount, uint256 receivedAmount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsFunded(address indexed funder, uint256 requestedAmount, uint256 receivedAmount);
    event RewardsClaimed(address indexed user, uint256 amount);

    constructor(address token_, uint256 aprBps_) Ownable(msg.sender) {
        require(token_ != address(0), "token is zero");
        require(aprBps_ <= 10_000, "APR too high");
        token = IERC20(token_);
        aprBps = aprBps_;
    }

    function setApr(uint256 newAprBps) external onlyOwner {
        require(newAprBps <= 10_000, "APR too high");
        require(!stakingStarted, "staking already started");
        aprBps = newAprBps;
    }

    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "zero amount");
        _accrue(msg.sender);

        uint256 balanceBefore = token.balanceOf(address(this));
        token.safeTransferFrom(msg.sender, address(this), amount);
        uint256 receivedAmount = token.balanceOf(address(this)) - balanceBefore;
        require(receivedAmount > 0, "zero received");

        positions[msg.sender].amount += receivedAmount;
        totalStaked += receivedAmount;
        stakingStarted = true;
        emit Staked(msg.sender, amount, receivedAmount);
    }

    function fundRewards(uint256 amount) external nonReentrant {
        require(amount > 0, "zero amount");

        uint256 balanceBefore = token.balanceOf(address(this));
        token.safeTransferFrom(msg.sender, address(this), amount);
        uint256 receivedAmount = token.balanceOf(address(this)) - balanceBefore;
        require(receivedAmount > 0, "zero received");

        rewardPool += receivedAmount;
        emit RewardsFunded(msg.sender, amount, receivedAmount);
    }

    function claim() external nonReentrant {
        _accrue(msg.sender);
        uint256 reward = positions[msg.sender].rewards;
        require(reward > 0, "no rewards");
        require(rewardPool >= reward, "insufficient rewards");

        positions[msg.sender].rewards = 0;
        rewardPool -= reward;
        token.safeTransfer(msg.sender, reward);
        emit RewardsClaimed(msg.sender, reward);
    }

    function unstake(uint256 amount) external nonReentrant {
        _accrue(msg.sender);
        require(amount > 0 && amount <= positions[msg.sender].amount, "invalid amount");
        positions[msg.sender].amount -= amount;
        totalStaked -= amount;
        token.safeTransfer(msg.sender, amount);
        emit Unstaked(msg.sender, amount);
    }

    function pendingRewards(address account) external view returns (uint256) {
        Position memory p = positions[account];
        return p.rewards + (p.amount * aprBps * (block.timestamp - p.updatedAt) / YEAR / 10_000);
    }

    function _accrue(address account) internal {
        Position storage p = positions[account];
        if (p.updatedAt != 0) {
            p.rewards += p.amount * aprBps * (block.timestamp - p.updatedAt) / YEAR / 10_000;
        }
        p.updatedAt = block.timestamp;
    }
}
