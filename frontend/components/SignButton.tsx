import React from "react";
import { useSignMessage } from "wagmi";
import { encodePacked, keccak256, parseSignature } from "viem";
import { TOKEN_ADDRESS } from "../constants/config";
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

const SignButton: React.FC<SignButtonProps> = ({
  jsonData,
  handleSubmit,
}) => {
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
  const handleSign = () => {
    if (jsonData) {
      const messageHash = keccak256(
        encodePacked(
          ["string", "uint256", "uint256", "address", "address"],
          [
            jsonData.repositoryName,
            BigInt(jsonData.issueId),
            BigInt(jsonData.reward * 10 ** 18),
            TOKEN_ADDRESS as `0x${string}`,
            jsonData.userAddress as `0x${string}`,
          ]
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
  return (
    <>
      {jsonData && (
        <div>
          <button
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
            onClick={handleSign}
          >
            Sign the Message
          </button>
        </div>
      )}
    </>
  );
};

export default SignButton;
