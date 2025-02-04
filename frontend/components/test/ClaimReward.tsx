// src/components/test/ClaimReward.tsx
"use client";

import { useState } from "react";
import { useGitHubIssueReward } from "../../hooks/useGitHubIssueReward";
import {
  InputField,
  TransactionButton,
  TransactionStatus,
} from "@/components/common/FormComponents";

interface FormData {
  repositoryName: string;
  issueId: string;
  githubId: string;
  signature: string;
}

export default function ClaimReward() {
  const [formData, setFormData] = useState<FormData>({
    repositoryName: "",
    issueId: "",
    githubId: "",
    signature: "",
  });

  const { claim, isPending, isConfirming, error, transactionHash } =
    useGitHubIssueReward();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await claim(
        formData.repositoryName,
        parseInt(formData.issueId),
        formData.githubId,
        formData.signature,
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleSignatureGeneration = async () => {
    try {
      // ここでMetaMaskなどを使用して署名を生成
      // 実装は別途必要
      console.log("Generate signature functionality needs to be implemented");
    } catch (error) {
      console.error("Error generating signature:", error);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Claim Reward</h2>
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
          label="GitHub ID"
          value={formData.githubId}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, githubId: e.target.value }))
          }
        />
        <div className="space-y-2">
          <InputField
            label="Signature"
            value={formData.signature}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, signature: e.target.value }))
            }
            placeholder="0x..."
          />
          <button
            type="button"
            onClick={handleSignatureGeneration}
            className="text-sm text-blue-500 hover:text-blue-600"
          >
            Generate Signature
          </button>
        </div>
        <TransactionButton isPending={isPending} isConfirming={isConfirming} />
        <TransactionStatus error={error} hash={transactionHash} />
      </form>

      {/* デバッグ情報 */}
      <div className="mt-8 p-4 bg-gray-50 rounded-md">
        <h3 className="text-sm font-medium mb-2">Debug Information:</h3>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(
            {
              formData,
              isPending,
              isConfirming,
              transactionHash,
            },
            null,
            2,
          )}
        </pre>
      </div>
    </div>
  );
}
