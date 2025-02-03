// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {ERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("USDT token", "USDT") {}

    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }
}
