// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract VistacionToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 21_000_000 ether;
    uint256 public burnBasisPoints;
    uint256 public constant MAX_BURN_BASIS_POINTS = 1_000; // 10% safety cap

    constructor(address treasury, uint256 initialBurnBasisPoints)
        ERC20("Vistacion", "VSC")
        Ownable(msg.sender)
    {
        require(treasury != address(0), "treasury is zero");
        require(initialBurnBasisPoints <= MAX_BURN_BASIS_POINTS, "burn too high");
        burnBasisPoints = initialBurnBasisPoints;
        _mint(treasury, MAX_SUPPLY);
    }

    function setBurnBasisPoints(uint256 newBasisPoints) external onlyOwner {
        require(newBasisPoints <= MAX_BURN_BASIS_POINTS, "burn too high");
        burnBasisPoints = newBasisPoints;
    }

    function _update(address from, address to, uint256 value) internal override {
        // Do not burn on mint or when burning; apply the fee only to transfers.
        if (from != address(0) && to != address(0) && burnBasisPoints != 0) {
            uint256 burnAmount = value * burnBasisPoints / 10_000;
            super._update(from, address(0), burnAmount);
            value -= burnAmount;
        }
        super._update(from, to, value);
    }
}
