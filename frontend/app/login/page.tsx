// src/app/page.tsx
"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import WalletAddress from "@/components/WalletAddress";

export default function Home() {
  const { login, logout, authenticated, user, ready } = usePrivy();
  const { wallets } = useWallets();

  // デバッグ用のログ
  console.log("User:", user);
  console.log("Available wallets:", wallets);
  wallets.forEach((wallet) => {
    console.log("Wallet details:", {
      type: wallet.walletClientType,
      address: wallet.address,
      chainId: wallet.chainId,
    });
  });

  if (!ready) {
    return <div>Loading...</div>;
  }

  return (
    <main>
      {authenticated ? (
        <div>
          <h1>Logged In</h1>
          {/* デバッグ用の情報表示 */}
          <div
            style={{ margin: "20px 0", padding: "10px", background: "#f5f5f5" }}
          >
            <h2>Debug Info:</h2>
            <pre>
              {JSON.stringify(
                {
                  walletCount: wallets.length,
                  walletTypes: wallets.map((w) => w.walletClientType),
                  userEmail: user?.email,
                  userId: user?.id,
                },
                null,
                2,
              )}
            </pre>
          </div>
          <button onClick={logout}>Logout</button>
          <WalletAddress />
        </div>
      ) : (
        <button onClick={login}>Login with Privy</button>
      )}
    </main>
  );
}
