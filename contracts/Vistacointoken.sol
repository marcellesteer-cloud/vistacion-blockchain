// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

contract VistacionToken is ERC20, ERC20Burnable, AccessControl, Pausable {
    uint256 public constant MAX_SUPPLY = 21_000_000 ether;

    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");
    bytes32 public constant STAKING_ROLE = keccak256("STAKING_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 public burnBasisPoints;
    mapping(address => bool) public blacklisted;

    constructor(address treasury, uint256 burnBasisPoints_) ERC20("Vistacoin", "VSC") {
        require(treasury != address(0), "treasury is zero");
        require(burnBasisPoints_ <= 10_000, "burn too high");

        burnBasisPoints = burnBasisPoints_;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(TREASURY_ROLE, treasury);
        _grantRole(STAKING_ROLE, msg.sender);
        _grantRole(GOVERNANCE_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);

        _mint(treasury, MAX_SUPPLY);
    }

    function setBurnBasisPoints(uint256 newBurnBasisPoints)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(newBurnBasisPoints <= 10_000, "burn too high");
        burnBasisPoints = newBurnBasisPoints;
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

    function _update(address from, address to, uint256 value)
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

        uint256 burnAmount = 0;
        uint256 netValue = value;
        if (from != address(0) && to != address(0) && value > 0 && burnBasisPoints > 0) {
            burnAmount = (value * burnBasisPoints) / 10_000;
            netValue = value - burnAmount;
            if (burnAmount > 0) {
                super._update(from, address(0), burnAmount);
            }
        }

        super._update(from, to, netValue);
    }
}

contract VistacoinToken is VistacionToken {
    constructor(address treasury) VistacionToken(treasury, 50) {}
}
