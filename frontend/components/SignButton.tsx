import React from "react";
import { useSignMessage } from "wagmi";
import { encodePacked, keccak256, parseSignature } from "viem";
import { TOKEN_ADDRESS } from "../constants/config";
import { useApproveToken } from "../hooks/useApproveToken";

interface SignButtonProps {
  jsonData: {
    repositoryName: string;
    issueId: number;
    reward: number;
    tokenAddress: string;
    userAddress: string;
  } | null;
  handleSubmit: (input: string) => void;
}

const SignButton: React.FC<SignButtonProps> = ({ jsonData, handleSubmit }) => {
  const { approveToken, allowance } = useApproveToken();
  const { signMessage } = useSignMessage({
    mutation: {
      onSuccess(data) {
        console.log("Success", data);
        handleSubmit("signature: " + data);
        const signature = parseSignature(data);
        console.log("signature", signature);
      },
    },
  });
  console.log("allowance", allowance);
  const handleSign = () => {
    if (jsonData) {
      const repositoryName = jsonData.repositoryName.replace(
        "https://github.com/",
        ""
      );

      const signData = [
        repositoryName,
        BigInt(jsonData.issueId),
        BigInt(jsonData.reward * 10 ** 18),
        TOKEN_ADDRESS as `0x${string}`,
        jsonData.userAddress as `0x${string}`,
      ];

      console.log(signData);

      const messageHash = keccak256(
        encodePacked(
          ["string", "uint256", "uint256", "address", "address"],
          signData as [string, bigint, bigint, `0x${string}`, `0x${string}`]
        )
      );
      console.log("messageHash", messageHash);

      const ethSignedMessageHash = keccak256(
        encodePacked(
          ["string", "bytes32"],
          ["\x19Ethereum Signed Message:\n32", messageHash]
        )
      );
      console.log("messaethSignedMessageHashgeHash", ethSignedMessageHash);
      signMessage({
        message: ethSignedMessageHash,
      });
    }
  };
  console.log(allowance && BigInt(allowance));
  console.log(allowance && BigInt(allowance) > BigInt(jsonData.reward * 10 ** 18))
  return (
    <>
      {jsonData && (
        <div>
          {allowance !== undefined && BigInt(allowance) < BigInt(jsonData.reward * 10 ** 18) ? (
            <>
              <p className="text-red-600 mb-2">
                Please approve the token before signing!
              </p>
              <button
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
                onClick={approveToken}
              >
                approve
              </button>
            </>
          ) : (
            <button
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
              onClick={handleSign}
            >
              Sign the Message
            </button>
          )}
        </div>
      )}
    </>
  );
};

export default SignButton;
