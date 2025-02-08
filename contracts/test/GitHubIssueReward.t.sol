// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {GitHubIssueReward} from "../src/GitHubIssueReward.sol";
import {ERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("MockToken", "MTK") {}

    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }
}

contract GitHubIssueRewardTest is Test {
    GitHubIssueReward public rewardContract;
    MockERC20 public token;
    address public owner;
    uint256 public ownerPrivateKey = uint256(0x1);
    uint256 public signerPrivateKey = uint256(0x2);
    address public signerAddress;
    address public privilegedAccount;
    address public contributor;
    uint256 private contributorPrivateKey = uint256(0x1); // Private key for signing

    string public repositoryName = "example/repo"; // Example repository name

    /// @notice Sets up the test environment by deploying the contract and minting tokens.
    function setUp() public {
        owner = vm.addr(ownerPrivateKey);
        contributor = vm.addr(contributorPrivateKey);
        signerAddress = vm.addr(signerPrivateKey);
        token = new MockERC20();
        rewardContract = new GitHubIssueReward(
            signerAddress,
            privilegedAccount
        );
        token.mint(owner, 1000 ether);
        vm.prank(owner);
        token.approve(address(rewardContract), 1000 ether);
    }

    /// @notice Tests the lockReward function to ensure rewards are correctly locked.
    function testLockReward() public {
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                repositoryName,
                uint256(1),
                uint256(100 ether),
                address(token),
                owner
            )
        );
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(
            ownerPrivateKey,
            ethSignedMessageHash
        );
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.prank(signerAddress);
        rewardContract.lockReward(
            repositoryName,
            1,
            100 ether,
            address(token),
            owner,
            signature
        );
        (
            uint256 reward,
            address tokenAddress,
            bool isCompleted
        ) = rewardContract.issues(repositoryName, 1);
        assertEq(reward, 100 ether);
        assertEq(tokenAddress, address(token));
        assertFalse(isCompleted);
    }

    /// @notice Tests the registerAndCompleteIssue function to ensure issues are correctly registered and completed.
    function testRegisterAndCompleteIssue() public {
        string[] memory githubIds = new string[](1);
        githubIds[0] = "contributor1";
        uint256[] memory percentages = new uint256[](1);
        percentages[0] = 100; // Assign 100% to a single contributor

        vm.prank(privilegedAccount);
        rewardContract.registerAndCompleteIssue(
            repositoryName,
            1,
            githubIds,
            percentages
        );
        (, , bool isCompleted) = rewardContract.issues(repositoryName, 1);
        assertTrue(isCompleted);
    }

    /// @notice Tests the linkGitHubToAddress function to ensure GitHub IDs are correctly linked to addresses.
    // function testLinkGitHubToAddress() public {
    //     vm.prank(privilegedAccount);
    //     rewardContract.linkGitHubToAddress("contributor1", contributor);
    //     assertEq(rewardContract.githubToAddress("contributor1"), contributor);
    // }

    /// @notice Tests the claimReward function to ensure contributors can claim their rewards correctly.
    function testClaimReward() public {
        string[] memory githubIds = new string[](1);
        githubIds[0] = "contributor1";
        uint256[] memory percentages = new uint256[](1);
        percentages[0] = 100; // Assign 100% to a single contributor

        bytes32 messageHash = keccak256(
            abi.encodePacked(
                repositoryName,
                uint256(1),
                uint256(100 ether),
                address(token),
                owner
            )
        );
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(
            ownerPrivateKey,
            ethSignedMessageHash
        );
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.prank(signerAddress);
        rewardContract.lockReward(
            repositoryName,
            1,
            100 ether,
            address(token),
            owner,
            signature
        );

        vm.prank(privilegedAccount);
        rewardContract.registerAndCompleteIssue(
            repositoryName,
            1,
            githubIds,
            percentages
        );
        // rewardContract.linkGitHubToAddress("contributor1", contributor);

        bytes32 messageHash2 = keccak256(
            abi.encodePacked("contributor1", contributor)
        );
        bytes32 ethSignedMessageHash2 = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash2)
        );
        (uint8 v2, bytes32 r2, bytes32 s2) = vm.sign(
            signerPrivateKey,
            ethSignedMessageHash2
        );
        bytes memory signature2 = abi.encodePacked(r2, s2, v2);

        vm.prank(contributor);
        rewardContract.claimReward(
            repositoryName,
            1,
            "contributor1",
            signature2
        );
    }
}
