// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
 
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
 
contract VistacoinToken is ERC20, ERC20Burnable, Ownable {
 
uint256 public constant MAX_SUPPLY = 500_000_000 ether;
 
constructor(address treasury)
ERC20("Vistacoin", "VSC")
Ownable(msg.sender)
{
require(treasury != address(0), "treasury is zero");
 
_mint(treasury, MAX_SUPPLY);
}
}