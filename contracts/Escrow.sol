// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Escrow is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    IERC20 public immutable token;
    address public oracle;
    struct Deal { address buyer; address seller; uint256 amount; bool docsSubmitted; bool resolved; }
    uint256 public nextId;
    mapping(uint256 => Deal) public deals;
    modifier onlyOracle() { require(msg.sender == oracle, "not oracle"); _; }
    constructor(address token_, address oracle_) Ownable(msg.sender) { require(token_ != address(0) && oracle_ != address(0), "zero address"); token = IERC20(token_); oracle = oracle_; }
    function setOracle(address newOracle) external onlyOwner { require(newOracle != address(0), "zero oracle"); oracle = newOracle; }
    function createEscrow(address seller, uint256 amount) external nonReentrant returns (uint256 id) { require(seller != address(0) && amount > 0, "invalid deal"); id = nextId++; deals[id] = Deal(msg.sender, seller, amount, false, false); token.safeTransferFrom(msg.sender, address(this), amount); }
    function submitDocs(uint256 id) external { Deal storage d = deals[id]; require(msg.sender == d.seller, "not seller"); require(!d.resolved, "resolved"); d.docsSubmitted = true; }
    function verifyAndRelease(uint256 id, bool ok) external onlyOracle nonReentrant { Deal storage d = deals[id]; require(!d.resolved && d.docsSubmitted, "not ready"); d.resolved = true; token.safeTransfer(ok ? d.seller : d.buyer, d.amount); }
}
