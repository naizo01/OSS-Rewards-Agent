import { PrivyClient } from "@privy-io/server-auth";
import { encodePacked, keccak256 } from "viem";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end(); // メソッドがPOSTでない場合は405エラー
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Authorization header missing" });
  }

  const privy = new PrivyClient(
    process.env.NEXT_PUBLIC_PRIVY_APP_ID || "",
    process.env.PRIVY_SECRET_ID || ""
  );
  try {
    const verifiedClaims = await privy.verifyAuthToken(authHeader);

    /**
curl --request POST https://api.privy.io/v1/policies \
-u "<your-privy-app-id>:<your-privy-app-secret>" \
-H "privy-app-id: <your-privy-app-id>" \
-H 'Content-Type: application/json' \
-d '{
    "version": "1.0",
    "name": "Allow Signing Only",
    "chain_type": "ethereum",
    "method_rules": [{
      "method": "eth_signTransaction",
      "rules": [{
        "name": "Allow only signing",
        "conditions": [],
        "action": "ALLOW"
      }]
    }],
    "default_action": "DENY"
}'
*/

/**
curl --request POST https://api.privy.io/v1/wallets \
-u "<your-privy-app-id>:<your-privy-app-secret>" \
-H "privy-app-id: <your-privy-app-id>" \
-H "privy-authorization-signature: <authorization-signature-for-request>" \
-H 'Content-Type: application/json' \
-d '{
  "chain_type": "ethereum",
  "policy_ids": ["<your-policy-id>"]
}'

 */

    const user = await privy.getUserById(verifiedClaims.userId);
    console.log("user.github.username", user?.github?.username);
    console.log("user.wallet.address:", user?.wallet?.address);

    const messageHash = keccak256(
      encodePacked(
        ["string", "address"],
        [
          user?.github?.username || "",
          (user?.wallet?.address || "0x0") as `0x${string}`,
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

    const response = await privy.walletApi.ethereum.signMessage({
      walletId: process.env.PRIVY_WALLET_ID || "",
      message: ethSignedMessageHash,
    });

    console.log("response", response);
    const { signature, encoding } = response;

    // トークンが有効な場合の処理
    res.status(200).json({
      message: "Token is valid",
      user: verifiedClaims,
      signature: signature,
      encoding: encoding,
      username: user?.github?.username,
    });
  } catch (error) {
    console.error(`Token verification failed with error ${error}.`);
    res.status(401).json({ error: "Invalid token" });
  }
}
