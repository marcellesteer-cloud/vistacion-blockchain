// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract ICO is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    IERC20 public immutable token;
    address payable public treasury;
    uint256 public priceWeiPerToken;
    uint256 public start;
    uint256 public end;
    constructor(address token_, uint256 price_, uint256 start_, uint256 end_, address payable treasury_) Ownable(msg.sender) { require(token_ != address(0) && treasury_ != address(0) && price_ > 0 && start_ < end_, "invalid config"); token = IERC20(token_); priceWeiPerToken = price_; start = start_; end = end_; treasury = treasury_; }
    function buy() external payable nonReentrant { require(block.timestamp >= start && block.timestamp <= end, "sale inactive"); require(msg.value > 0, "zero payment"); uint256 amount = msg.value * 1 ether / priceWeiPerToken; require(amount > 0 && token.balanceOf(address(this)) >= amount, "insufficient tokens"); token.safeTransfer(msg.sender, amount); (bool sent,) = treasury.call{value: msg.value}(""); require(sent, "ETH transfer failed"); }
    function setPrice(uint256 newPrice) external onlyOwner { require(newPrice > 0, "zero price"); priceWeiPerToken = newPrice; }
    function withdrawUnsold() external onlyOwner { require(block.timestamp > end, "sale active"); token.safeTransfer(owner(), token.balanceOf(address(this))); }
}
