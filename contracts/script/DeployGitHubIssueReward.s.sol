// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {GitHubIssueReward} from "../src/GitHubIssueReward.sol";
import "./base/DeployBase.sol";

contract DeployGitHubIssueReward is DeployBase {
    address public privilegedAccount =
        0x5C8C6dC9EBAA6B911B3031b94C522a0073BC81E3;
    address public signerAddress = 0x1De0Ee4C79f4C022D87347E143DdC3122C5cDDed;

    function run() external {
        vm.startBroadcast();

        // GitHubIssueRewardコントラクトをデプロイ
        GitHubIssueReward rewardContract = new GitHubIssueReward(
            signerAddress,
            privilegedAccount
        );

        // デプロイされたコントラクトのアドレスを出力
        writeDeployedAddress(address(rewardContract), "GitHubIssueReward");
        console.log("GitHubIssueReward deployed at:", address(rewardContract));

        vm.stopBroadcast();
    }
}
