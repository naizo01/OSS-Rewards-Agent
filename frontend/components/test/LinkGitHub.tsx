// src/components/test/LinkGitHub.tsx
"use client";

import { useState } from "react";
import { useGitHubIssueReward } from "../../hooks/useGitHubIssueReward";
import {
  InputField,
  TransactionButton,
  TransactionStatus,
} from "@/components/common/FormComponents";

interface FormData {
  githubId: string;
  contributorAddress: string;
}

export default function LinkGitHub() {
  const [formData, setFormData] = useState<FormData>({
    githubId: "",
    contributorAddress: "",
  });

  const { linkGitHub, isPending, isConfirming, error, transactionHash } =
    useGitHubIssueReward();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await linkGitHub(formData.githubId, formData.contributorAddress);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Link GitHub Account</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          label="GitHub ID"
          value={formData.githubId}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, githubId: e.target.value }))
          }
          placeholder="e.g., octocat"
        />
        <InputField
          label="Contributor Address"
          value={formData.contributorAddress}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              contributorAddress: e.target.value,
            }))
          }
          placeholder="0x..."
        />
        <TransactionButton isPending={isPending} isConfirming={isConfirming} />
        <TransactionStatus error={error} hash={transactionHash} />
      </form>
    </div>
  );
}
