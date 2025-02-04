// src/hooks/useGitHubIssueReward.ts
import {
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import githubIssueRewardABI from "@/lib/abi/githubIssueReward.json";

const CONTRACT_ADDRESS = process.env
  .NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

if (!CONTRACT_ADDRESS) {
  throw new Error("Contract address is not defined");
}

export function useGitHubIssueReward() {
  const {
    writeContract: write,
    data: hash,
    isPending,
    error,
  } = useWriteContract();

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
  });

  // Lock Reward
  const lockRewardForIssue = async (
    repositoryName: string,
    issueId: number,
    reward: bigint,
    tokenAddress: string,
  ) => {
    try {
      await write({
        address: CONTRACT_ADDRESS,
        abi: githubIssueRewardABI.abi,
        functionName: "lockReward",
        args: [repositoryName, BigInt(issueId), reward, tokenAddress],
      });
    } catch (error) {
      console.error("Error locking reward:", error);
      throw error;
    }
  };

  // Register and Complete Issue
  const completeIssue = async (
    repositoryName: string,
    issueId: number,
    githubIds: string[],
    percentages: number[],
  ) => {
    try {
      await write({
        address: CONTRACT_ADDRESS,
        abi: githubIssueRewardABI.abi,
        functionName: "registerAndCompleteIssue",
        args: [
          repositoryName,
          BigInt(issueId),
          githubIds,
          percentages.map(BigInt),
        ],
      });
    } catch (error) {
      console.error("Error completing issue:", error);
      throw error;
    }
  };

  // Link GitHub to Address
  const linkGitHub = async (githubId: string, address: string) => {
    try {
      await write({
        address: CONTRACT_ADDRESS,
        abi: githubIssueRewardABI.abi,
        functionName: "linkGitHubToAddress",
        args: [githubId, address],
      });
    } catch (error) {
      console.error("Error linking GitHub:", error);
      throw error;
    }
  };

  // Claim Reward
  const claim = async (
    repositoryName: string,
    issueId: number,
    githubId: string,
    signature: string,
  ) => {
    try {
      await write({
        address: CONTRACT_ADDRESS,
        abi: githubIssueRewardABI.abi,
        functionName: "claimReward",
        args: [repositoryName, BigInt(issueId), githubId, signature],
      });
    } catch (error) {
      console.error("Error claiming reward:", error);
      throw error;
    }
  };

  return {
    lockRewardForIssue,
    completeIssue,
    linkGitHub,
    claim,
    isPending,
    isConfirming,
    error,
    transactionHash: hash,
  };
}
