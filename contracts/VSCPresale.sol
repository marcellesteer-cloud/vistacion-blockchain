// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ICO} from "./ICO.sol";

contract VSCPresale is ICO {
    constructor(address token_, uint256 price_, uint256 start_, uint256 end_, address payable treasury_)
        ICO(token_, price_, start_, end_, treasury_)
    {}
}
