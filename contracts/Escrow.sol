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

    struct Deal {
        address buyer;
        address seller;
        uint256 amount;
        bool docsSubmitted;
        bool resolved;
    }

    uint256 public nextId;
    mapping(uint256 => Deal) public deals;

    event OracleUpdated(address indexed previousOracle, address indexed newOracle);
    event EscrowCreated(uint256 indexed id, address indexed buyer, address indexed seller, uint256 requestedAmount, uint256 escrowedAmount);
    event DocumentsSubmitted(uint256 indexed id, address indexed seller);
    event EscrowResolved(uint256 indexed id, address indexed recipient, bool approved, uint256 amount);

    modifier onlyOracle() {
        require(msg.sender == oracle, "not oracle");
        _;
    }

    constructor(address token_, address oracle_) Ownable(msg.sender) {
        require(token_ != address(0) && oracle_ != address(0), "zero address");
        token = IERC20(token_);
        oracle = oracle_;
    }

    function setOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "zero oracle");
        emit OracleUpdated(oracle, newOracle);
        oracle = newOracle;
    }

    function createEscrow(address seller, uint256 amount) external nonReentrant returns (uint256 id) {
        require(seller != address(0) && amount > 0, "invalid deal");

        uint256 balanceBefore = token.balanceOf(address(this));
        token.safeTransferFrom(msg.sender, address(this), amount);
        uint256 receivedAmount = token.balanceOf(address(this)) - balanceBefore;
        require(receivedAmount > 0, "zero received");

        id = nextId++;
        deals[id] = Deal(msg.sender, seller, receivedAmount, false, false);
        emit EscrowCreated(id, msg.sender, seller, amount, receivedAmount);
    }

    function submitDocs(uint256 id) external {
        Deal storage deal = deals[id];
        require(msg.sender == deal.seller, "not seller");
        require(!deal.resolved, "resolved");
        deal.docsSubmitted = true;
        emit DocumentsSubmitted(id, msg.sender);
    }

    function verifyAndRelease(uint256 id, bool ok) external onlyOracle nonReentrant {
        Deal storage deal = deals[id];
        require(!deal.resolved && deal.docsSubmitted, "not ready");

        deal.resolved = true;
        address recipient = ok ? deal.seller : deal.buyer;
        uint256 amount = deal.amount;
        token.safeTransfer(recipient, amount);
        emit EscrowResolved(id, recipient, ok, amount);
    }
}
