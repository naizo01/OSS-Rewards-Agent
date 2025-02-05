import { useState } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { erc20Abi } from 'viem'

export function useApproveToken() {
  const [error, setError] = useState<Error | null>(null);
  const CONTRACT_ADDRESS = "0x3724091348776cC2C1FF205Fd500A4B0787B110D" as `0x${string}`;
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
        address: CONTRACT_ADDRESS,
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