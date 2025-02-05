"use client";

import { useState } from "react";
import { useApproveToken } from "../../hooks/useApproveToken";
import {
  InputField,
  TransactionButton,
  TransactionStatus,
} from "@/components/common/FormComponents";

export default function ApproveToken() {
  const [formData, setFormData] = useState({
    tokenAddress: "",
    spenderAddress: "",
    amount: "",
  });

  const { approveToken, isPending, isConfirming, error, transactionHash } =
    useApproveToken();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await approveToken(
        formData.spenderAddress as `0x${string}`,
        BigInt(formData.amount)
      );
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Approve Token</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          label="Spender Address"
          value={formData.spenderAddress}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, spenderAddress: e.target.value }))
          }
        />
        <InputField
          label="Amount"
          type="number"
          value={formData.amount}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, amount: e.target.value }))
          }
        />
        <TransactionButton isPending={isPending} isConfirming={isConfirming} />
        <TransactionStatus error={error} hash={transactionHash} />
      </form>
    </div>
  );
} 