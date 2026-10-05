// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
 
contract VistacoinToken is ERC20, ERC20Burnable, AccessControl, Pausable {
 
uint256 public constant MAX_SUPPLY = 500_000_000 ether;

bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");
bytes32 public constant STAKING_ROLE = keccak256("STAKING_ROLE");
bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
 
mapping(address => bool) public blacklisted;
 
constructor(address treasury)
ERC20("Vistacoin", "VSC")
{
require(treasury != address(0), "treasury is zero");
 
_grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
_grantRole(TREASURY_ROLE, treasury);
_grantRole(STAKING_ROLE, msg.sender);
_grantRole(GOVERNANCE_ROLE, msg.sender);
_grantRole(PAUSER_ROLE, msg.sender);
 
_mint(treasury, MAX_SUPPLY);
}
 
function pause() external onlyRole(PAUSER_ROLE) {
_pause();
}
 
function unpause() external onlyRole(PAUSER_ROLE) {
_unpause();
}
 
function addToBlacklist(address account)
external
onlyRole(DEFAULT_ADMIN_ROLE)
{
blacklisted[account] = true;
}

function removeFromBlacklist(address account)
external
onlyRole(DEFAULT_ADMIN_ROLE)
{
blacklisted[account] = false;
}
 
function _update(
address from,
address to,
uint256 value
)
internal
override
whenNotPaused
{
if (from != address(0)) {
require(!blacklisted[from], "sender blacklisted");
}
 
if (to != address(0)) {
require(!blacklisted[to], "recipient blacklisted");
}
 
super._update(from, to, value);
}
}