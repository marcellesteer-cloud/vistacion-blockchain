// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Staking} from "./Staking.sol";

contract VSCStaking is Staking {
    constructor(address tokenAddress) Staking(tokenAddress, 500) {}
}
