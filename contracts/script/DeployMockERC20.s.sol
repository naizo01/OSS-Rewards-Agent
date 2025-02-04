// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {MockERC20} from "../src/test/MockERC20.sol";
import "./base/DeployBase.sol";

contract DeployMockERC20 is DeployBase {
    function run() external {
        vm.startBroadcast();

        // Deploy the MockERC20 contract
        MockERC20 mockToken = new MockERC20();

        // Output the deployed contract address
        writeDeployedAddress(address(mockToken), "MockERC20");
        console.log("MockERC20 deployed at:", address(mockToken));

        vm.stopBroadcast();
    }
} 