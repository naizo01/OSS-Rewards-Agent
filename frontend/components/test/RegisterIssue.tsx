// src/components/test/RegisterIssue.tsx
"use client";

import { useState } from "react";
import { useGitHubIssueReward } from "../../hooks/useGitHubIssueReward";
import {
  InputField,
  TransactionButton,
  TransactionStatus,
} from "@/components/common/FormComponents";

export default function RegisterIssue() {
  const [formData, setFormData] = useState({
    repositoryName: "",
    issueId: "",
    githubIds: "",
    percentages: "",
  });

  const { completeIssue, isPending, isConfirming, error, transactionHash } =
    useGitHubIssueReward();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const githubIdArray = formData.githubIds
        .split(",")
        .map((id) => id.trim());
      const percentageArray = formData.percentages
        .split(",")
        .map((p) => parseInt(p.trim()));

      await completeIssue(
        formData.repositoryName,
        parseInt(formData.issueId),
        githubIdArray,
        percentageArray,
      );
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        Register and Complete Issue
      </h2>
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
          label="GitHub IDs (comma-separated)"
          value={formData.githubIds}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, githubIds: e.target.value }))
          }
          placeholder="user1, user2, user3"
        />
        <InputField
          label="Percentages (comma-separated)"
          value={formData.percentages}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, percentages: e.target.value }))
          }
          placeholder="50, 30, 20"
        />
        <TransactionButton isPending={isPending} isConfirming={isConfirming} />
        <TransactionStatus error={error} hash={transactionHash} />
      </form>
    </div>
  );
}
