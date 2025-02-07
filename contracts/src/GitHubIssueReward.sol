// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {IERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

contract GitHubIssueReward {
    address public owner; // The owner of the contract
    address public signerAddress; // Address used for signing
    address public privilegedAccount; // Account with special privileges
    mapping(string => mapping(uint256 => Issue)) public issues; // Mapping from repository name to issue ID to Issue struct

    struct Issue {
        uint256 reward; // Total reward amount for the issue
        address tokenAddress; // Address of the token used for the reward
        string[] contributors; // List of GitHub IDs of contributors
        mapping(string => uint256) contributorPercentages; // Reward percentage for each GitHub ID
        bool isCompleted; // Status of the issue completion
    }

    event RewardLocked(
        string indexed repositoryName,
        uint256 indexed issueId,
        uint256 reward,
        address tokenAddress,
        address userAddress
    );
    event IssueCompleted(
        string indexed repositoryName,
        uint256 indexed issueId,
        string[] contributors
    );
    event GitHubLinked(
        string indexed githubId,
        address indexed contributorAddress
    );
    event RewardClaimed(
        string indexed repositoryName,
        uint256 indexed issueId,
        string indexed githubId,
        address claimant
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }

    modifier onlyPrivileged() {
        require(msg.sender == privilegedAccount, "Not the privileged account");
        _;
    }

    /// @notice Initializes the contract with the signer and privileged account addresses.
    /// @param _signerAddress The address of the signer account.
    /// @param _privilegedAccount The address of the privileged account.
    constructor(address _signerAddress, address _privilegedAccount) {
        owner = msg.sender;
        signerAddress = _signerAddress;
        privilegedAccount = _privilegedAccount;
    }

    /// @notice Sets the signer address. Can only be called by the owner.
    /// @param _signerAddress The address to be used for signing.
    function setSignerAddress(address _signerAddress) public onlyOwner {
        signerAddress = _signerAddress;
    }

    /// @notice Sets the privileged account address. Can only be called by the owner.
    /// @param _privilegedAccount The address to be given special privileges.
    function setPrivilegedAddress(address _privilegedAccount) public onlyOwner {
        privilegedAccount = _privilegedAccount;
    }

    /// @notice Locks a reward for a specific issue with user signature verification.
    /// @param repositoryName The name of the repository.
    /// @param issueId The ID of the issue.
    /// @param reward The amount of reward to lock.
    /// @param tokenAddress The address of the token to be used for the reward.
    /// @param userAddress The address of the user.
    /// @param signature The signature from the user to verify the transaction.
    function lockReward(
        string memory repositoryName,
        uint256 issueId,
        uint256 reward,
        address tokenAddress,
        address userAddress,
        bytes memory signature
    ) public {
        // Verify signature
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                repositoryName,
                issueId,
                reward,
                tokenAddress,
                userAddress
            )
        );
        require(
            recoverSigner(messageHash, signature) == userAddress,
            "Invalid signature"
        );

        IERC20 token = IERC20(tokenAddress);
        require(
            token.transferFrom(userAddress, address(this), reward),
            "Transfer failed"
        );
        issues[repositoryName][issueId].reward += reward; // Add reward
        issues[repositoryName][issueId].tokenAddress = tokenAddress;
        emit RewardLocked(
            repositoryName,
            issueId,
            reward,
            tokenAddress,
            userAddress
        );
    }

    /// @notice Registers contributors and completes an issue.
    /// @param repositoryName The name of the repository.
    /// @param issueId The ID of the issue.
    /// @param githubIds The list of GitHub IDs of contributors.
    /// @param percentages The list of reward percentages for each contributor.
    function registerAndCompleteIssue(
        string memory repositoryName,
        uint256 issueId,
        string[] memory githubIds,
        uint256[] memory percentages
    ) public onlyPrivileged {
        require(
            !issues[repositoryName][issueId].isCompleted,
            "Issue already completed"
        );
        require(githubIds.length == percentages.length, "Mismatched inputs");

        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < githubIds.length; i++) {
            issues[repositoryName][issueId].contributors.push(githubIds[i]);
            issues[repositoryName][issueId].contributorPercentages[
                    githubIds[i]
                ] = percentages[i];
            totalPercentage += percentages[i];
        }
        require(totalPercentage == 100, "Total percentage must be 100");

        issues[repositoryName][issueId].isCompleted = true;
        emit IssueCompleted(repositoryName, issueId, githubIds);
    }

    /// @notice Allows a contributor to claim their reward for a completed issue.
    /// @param repositoryName The name of the repository.
    /// @param issueId The ID of the issue.
    /// @param githubId The GitHub ID of the contributor.
    /// @param signature The signature to verify the claim.
    function claimReward(
        string memory repositoryName,
        uint256 issueId,
        string memory githubId,
        bytes memory signature
    ) public {
        require(
            issues[repositoryName][issueId].isCompleted,
            "Issue not completed"
        );
        require(
            isContributor(repositoryName, issueId, githubId),
            "Not a contributor"
        );

        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(githubId, msg.sender));
        require(
            recoverSigner(messageHash, signature) == signerAddress,
            "Invalid signature"
        );

        // Calculate reward based on percentage
        uint256 contributorPercentage = issues[repositoryName][issueId]
            .contributorPercentages[githubId];
        uint256 rewardForContributor = (issues[repositoryName][issueId].reward *
            contributorPercentage) / 100;

        IERC20 token = IERC20(issues[repositoryName][issueId].tokenAddress);
        require(
            token.transfer(msg.sender, rewardForContributor),
            "Transfer failed"
        );
        emit RewardClaimed(repositoryName, issueId, githubId, msg.sender);
    }

    /// @notice Checks if a GitHub ID is a contributor to a specific issue.
    /// @param repositoryName The name of the repository.
    /// @param issueId The ID of the issue.
    /// @param githubId The GitHub ID to check.
    /// @return True if the GitHub ID is a contributor, false otherwise.
    function isContributor(
        string memory repositoryName,
        uint256 issueId,
        string memory githubId
    ) internal view returns (bool) {
        for (
            uint256 i = 0;
            i < issues[repositoryName][issueId].contributors.length;
            i++
        ) {
            if (
                keccak256(
                    abi.encodePacked(
                        issues[repositoryName][issueId].contributors[i]
                    )
                ) == keccak256(abi.encodePacked(githubId))
            ) {
                return true;
            }
        }
        return false;
    }

    /// @notice Recovers the signer address from a message hash and signature.
    /// @param messageHash The hash of the message.
    /// @param signature The signature to recover the signer from.
    /// @return The address of the signer.
    function recoverSigner(
        bytes32 messageHash,
        bytes memory signature
    ) internal pure returns (address) {
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(signature);
        return ecrecover(ethSignedMessageHash, v, r, s);
    }

    /// @notice Splits a signature into its components.
    /// @param sig The signature to split.
    /// @return r The r component of the signature.
    /// @return s The s component of the signature.
    /// @return v The v component of the signature.
    function splitSignature(
        bytes memory sig
    ) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "Invalid signature length");
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }

    /// @notice Fallback function to receive Ether.
    receive() external payable {}
}
