// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
 
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
 
contract VSCPresale is AccessControl, Pausable, ReentrancyGuard {
using SafeERC20 for IERC20;
 
bytes32 public constant SALE_MANAGER_ROLE =
keccak256("SALE_MANAGER_ROLE");
 
bytes32 public constant PAUSER_ROLE =
keccak256("PAUSER_ROLE");
 
uint256 public constant SOFT_CAP =
10_000_000 ether;
 
uint256 public constant HARD_CAP =
25_000_000 ether;
 
IERC20 public immutable token;
 
address payable public treasury;
 
enum SalePhase {
Private,
Community,
Public
}
 
SalePhase public currentPhase;
 
mapping(address => bool)
public whitelisted;
 
mapping(address => bool)
public approvedInvestors;
 
mapping(address => uint256)
public purchased;
 
uint256 public totalRaised;
 
uint256 public privatePrice;
uint256 public communityPrice;
uint256 public publicPrice;
 
event TokensPurchased(
address indexed buyer,
uint256 amount,
SalePhase phase
);
 
event PhaseChanged(
SalePhase phase
);
 
event InvestorApproved(
address indexed investor
);
 
event InvestorRemoved(
address indexed investor
);
 
event Whitelisted(
address indexed investor
);
 
event RemovedFromWhitelist(
address indexed investor
);
 
event Claimed(
address indexed investor,
uint256 amount
);
 
constructor(
address tokenAddress,
address payable treasuryAddress
) {
require(
tokenAddress != address(0),
"token zero"
);
 
require(
treasuryAddress != address(0),
"treasury zero"
);
 
token = IERC20(tokenAddress);
treasury = treasuryAddress;
 
_grantRole(
DEFAULT_ADMIN_ROLE,
msg.sender
);
 
_grantRole(
SALE_MANAGER_ROLE,
msg.sender
);
 
_grantRole(
PAUSER_ROLE,
msg.sender
);
 
privatePrice = 0.05 ether;
communityPrice = 0.08 ether;
publicPrice = 0.10 ether;
 
currentPhase =
SalePhase.Private;
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
 
function setPhase(
SalePhase phase
)
external
onlyRole(SALE_MANAGER_ROLE)
{
currentPhase = phase;
 
emit PhaseChanged(
phase
);
}
 
function approveInvestor(
address investor
)
external
onlyRole(SALE_MANAGER_ROLE)
{
approvedInvestors[
investor
] = true;
 
emit InvestorApproved(
investor
);
}
 
function removeInvestor(
address investor
)
external
onlyRole(SALE_MANAGER_ROLE)
{
approvedInvestors[
investor
] = false;
 
emit InvestorRemoved(
investor
);
}
 
function addToWhitelist(
address investor
)
external
onlyRole(SALE_MANAGER_ROLE)
{
whitelisted[
investor
] = true;
 
emit Whitelisted(
investor
);
}
 
function removeFromWhitelist(
address investor
)
external
onlyRole(SALE_MANAGER_ROLE)
{
whitelisted[
investor
] = false;
 
emit RemovedFromWhitelist(
investor
);
}
 
function buy()
external
payable
nonReentrant
whenNotPaused
{
require(
approvedInvestors[
msg.sender
],
"not approved"
);
 
if (
currentPhase ==
SalePhase.Community
) {
require(
whitelisted[
msg.sender
],
"not whitelisted"
);
}
 
require(
msg.value > 0,
"zero payment"
);
 
require(
totalRaised +
msg.value <=
HARD_CAP,
"hard cap reached"
);
 
uint256 price =
getCurrentPrice();
 
uint256 amount =
(msg.value *
1 ether)
/ price;
 
purchased[
msg.sender
] += amount;
 
totalRaised +=
msg.value;
 
(bool sent,) =
treasury.call{
value: msg.value
}("");
 
require(
sent,
"payment failed"
);
 
emit TokensPurchased(
msg.sender,
amount,
currentPhase
);
}
 
function claim()
external
nonReentrant
whenNotPaused
{
uint256 amount =
purchased[
msg.sender
];
 
require(
amount > 0,
"nothing to claim"
);
 
require(
token.balanceOf(
address(this)
) >= amount,
"insufficient tokens"
);
 
purchased[
msg.sender
] = 0;
 
token.safeTransfer(
msg.sender,
amount
);
 
emit Claimed(
msg.sender,
amount
);
}
 
function getCurrentPrice()
public
view
returns (uint256)
{
if (
currentPhase ==
SalePhase.Private
) {
return privatePrice;
}
 
if (
currentPhase ==
SalePhase.Community
) {
return communityPrice;
}
 
return publicPrice;
}
 
function softCapReached()
public
view
returns (bool)
{
return totalRaised >=
SOFT_CAP;
}
 
function hardCapReached()
public
view
returns (bool)
{
return totalRaised >=
HARD_CAP;
}
 
function withdrawUnsold()
external
onlyRole(DEFAULT_ADMIN_ROLE)
{
token.safeTransfer(
msg.sender,
token.balanceOf(
address(this)
)
);
}
}