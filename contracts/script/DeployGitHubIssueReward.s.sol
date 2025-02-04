// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {GitHubIssueReward} from "../src/GitHubIssueReward.sol";
import "./base/DeployBase.sol";

contract DeployGitHubIssueReward is DeployBase {
    address public privilegedAccount =
        0xcAF16f8240d7c2Ab1e1975CB83F2839457a294a4;
    address public ownerAccount = 0xcAF16f8240d7c2Ab1e1975CB83F2839457a294a4;

    function run() external {
        vm.startBroadcast();

        // GitHubIssueRewardコントラクトをデプロイ
        GitHubIssueReward rewardContract = new GitHubIssueReward(
            ownerAccount,
            privilegedAccount
        );

        // デプロイされたコントラクトのアドレスを出力
        writeDeployedAddress(address(rewardContract), "GitHubIssueReward");
        console.log("GitHubIssueReward deployed at:", address(rewardContract));

        vm.stopBroadcast();
    }
}
