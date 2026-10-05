// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
 
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
 
contract VSCStakingv2 is AccessControl, Pausable, ReentrancyGuard {
using SafeERC20 for IERC20;
 
bytes32 public constant REWARD_MANAGER_ROLE =
keccak256("REWARD_MANAGER_ROLE");
 
bytes32 public constant PAUSER_ROLE =
keccak256("PAUSER_ROLE");
 
uint256 public constant YEAR = 365 days;
 
uint256 public constant MIN_STAKE = 500 ether;
uint256 public constant MAX_STAKE = 10_000_000 ether;
 
uint256 public constant FLEXIBLE_APY = 500; // 5%
uint256 public constant LOCK90_APY = 1000; // 10%
uint256 public constant LOCK180_APY = 1500; // 15%
uint256 public constant LOCK365_APY = 2000; // 20%
 
IERC20 public immutable token;
 
enum PoolType {
FLEXIBLE,
LOCK_90,
LOCK_180,
LOCK_365
}
 
struct Position {
uint256 amount;
uint256 rewards;
uint256 startTime;
uint256 lastUpdate;
PoolType poolType;
}

mapping(address => Position) public positions;
 
event Staked(
address indexed user,
uint256 amount,
PoolType poolType
);
 
event Claimed(
address indexed user,
uint256 amount
);
 
event Compounded(
address indexed user,
uint256 amount
);
 
event Unstaked(
address indexed user,
uint256 amount
);
 
constructor(address tokenAddress) {
require(tokenAddress != address(0), "token is zero");
 
token = IERC20(tokenAddress);
 
_grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
_grantRole(REWARD_MANAGER_ROLE, msg.sender);
_grantRole(PAUSER_ROLE, msg.sender);
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
 
function stake(
uint256 amount,
PoolType poolType
)
external
nonReentrant
whenNotPaused
{
require(amount >= MIN_STAKE, "below minimum");
require(amount <= MAX_STAKE, "above maximum");
 
Position storage position = positions[msg.sender];
 
_accrue(msg.sender);
 
position.amount += amount;
position.poolType = poolType;
 
if (position.startTime == 0) {
position.startTime = block.timestamp;
}
 
token.safeTransferFrom(
msg.sender,
address(this),
amount
);
 
emit Staked(
msg.sender,
amount,
poolType
);
}
 
function claim()
external
nonReentrant
whenNotPaused
{
_accrue(msg.sender);
 
uint256 reward = positions[msg.sender].rewards;
 
require(reward > 0, "no rewards");
 
positions[msg.sender].rewards = 0;
 
token.safeTransfer(
msg.sender,
reward
);
 
emit Claimed(
msg.sender,
reward
);
}
 
function compound()
external
nonReentrant
whenNotPaused
{
_accrue(msg.sender);
 
uint256 reward = positions[msg.sender].rewards;
 
require(reward > 0, "no rewards");
 
positions[msg.sender].rewards = 0;
positions[msg.sender].amount += reward;
 
emit Compounded(
msg.sender,
reward
);
}
 
function unstake(
uint256 amount
)
external
nonReentrant
whenNotPaused
{
_accrue(msg.sender);
 
Position storage position =
positions[msg.sender];
 
require(
amount > 0 &&
amount <= position.amount,
"invalid amount"
);
 
position.amount -= amount;
 
token.safeTransfer(
msg.sender,
amount
);
 
emit Unstaked(
msg.sender,
amount
);
}
 
function pendingRewards(
address account
)
public
view
returns (uint256)
{
Position memory p =
positions[account];
 
if (p.lastUpdate == 0) {
return p.rewards;
}
 
uint256 elapsed =
block.timestamp - p.lastUpdate;
 
uint256 apy =
getPoolAPY(p.poolType);
 
uint256 accrued =
(
p.amount *
apy *
elapsed
) /
YEAR /
10000;
 
return p.rewards + accrued;
}
 
function getPoolAPY(
PoolType poolType
)
public
pure
returns (uint256)
{
if (
poolType ==
PoolType.FLEXIBLE
) {
return FLEXIBLE_APY;
}
 
if (
poolType ==
PoolType.LOCK_90
) {
return LOCK90_APY;
}
 
if (
poolType ==
PoolType.LOCK_180
) {
return LOCK180_APY;
}
 
return LOCK365_APY;
}
 
function _accrue(
address account
)
internal
{
Position storage p =
positions[account];
 
if (p.lastUpdate != 0) {
p.rewards =
pendingRewards(account);
}

p.lastUpdate =
block.timestamp;
}
}