// src/components/test/LockReward.tsx
"use client";

import { useState } from "react";
import { useGitHubIssueReward } from "../..//hooks/useGitHubIssueReward";
import {
  InputField,
  TransactionButton,
  TransactionStatus,
} from "@/components/common/FormComponents";

interface FormData {
  repositoryName: string;
  issueId: string;
  reward: string;
  tokenAddress: string;
}

export default function LockReward() {
  const [formData, setFormData] = useState<FormData>({
    repositoryName: "",
    issueId: "",
    reward: "",
    tokenAddress: "",
  });

  const {
    lockRewardForIssue,
    isPending,
    isConfirming,
    error,
    transactionHash,
  } = useGitHubIssueReward();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await lockRewardForIssue(
        formData.repositoryName,
        parseInt(formData.issueId),
        BigInt(formData.reward),
        formData.tokenAddress,
      );
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Lock Reward</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          label="Repository Name"
          value={formData.repositoryName}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, repositoryName: e.target.value }))
          }
        />
        <InputField
          label="Issue ID"
          type="number"
          value={formData.issueId}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, issueId: e.target.value }))
          }
        />
        <InputField
          label="Reward Amount"
          type="number"
          value={formData.reward}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, reward: e.target.value }))
          }
        />
        <InputField
          label="Token Address"
          value={formData.tokenAddress}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, tokenAddress: e.target.value }))
          }
        />
        <TransactionButton isPending={isPending} isConfirming={isConfirming} />
        <TransactionStatus error={error} hash={transactionHash} />
      </form>
    </div>
  );
}
