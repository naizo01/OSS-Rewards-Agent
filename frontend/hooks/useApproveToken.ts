import { useState } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { erc20Abi } from 'viem'
import { TOKEN_ADDRESS } from "@/constants/config";

export function useApproveToken() {
  const [error, setError] = useState<Error | null>(null);

  const {
    writeContract: write,
    data: hash,
    isPending,
  } = useWriteContract();

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
  });

  const approveToken = async (
    spenderAddress: `0x${string}`,
    amount: bigint
  ) => {
    try {
      await write({
        address: TOKEN_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [spenderAddress, amount],
      });
    } catch (error) {
      console.error("Error approving token:", error);
      setError(error as Error);
      throw error;
    }
  };

  return {
    approveToken,
    isPending,
    isConfirming,
    error,
    transactionHash: hash,
  };
} 