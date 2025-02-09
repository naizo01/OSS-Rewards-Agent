import { useState, useEffect } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useAccount,
} from "wagmi";
import { erc20Abi } from "viem";
import { TOKEN_ADDRESS, CONTRACT_ADDRESS } from "@/constants/config";

export function useApproveToken() {
  const [error, setError] = useState<Error | null>(null);
  const { address } = useAccount();

  const { writeContract: write, data: hash, isPending } = useWriteContract();

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
  });



  const { data: allowance, refetch: fetchAllowance } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address as `0x${string}`, CONTRACT_ADDRESS as `0x${string}`],
  });

  useEffect(() => {
    if (!isConfirming) {
      fetchAllowance();
    }
  }, [isConfirming]);

  const approveToken = async () => {
    try {
      await write({
        address: TOKEN_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [
          CONTRACT_ADDRESS,
          BigInt(
            11579208923731619542357098500868790785326998466564056403945758400791312963995
          ),
        ],
      });
    } catch (error) {
      console.error("Error approving token:", error);
      setError(error as Error);
      throw error;
    }
  };

  return {
    approveToken,
    fetchAllowance,
    allowance,
    isPending,
    isConfirming,
    error,
    transactionHash: hash,
  };
}
