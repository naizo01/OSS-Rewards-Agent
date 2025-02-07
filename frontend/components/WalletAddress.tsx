// src/app/components/WalletAddress.tsx
"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useChainId } from "wagmi";
import { useState } from "react";

export default function WalletAddress() {
  const { authenticated, ready, connectWallet } = usePrivy();
  const { wallets } = useWallets();
  const chainId = useChainId();
  const [selectedWalletType, setSelectedWalletType] = useState<
    "privy" | "external"
  >("privy");

  if (!ready) return <div>Loading...</div>;
  if (!authenticated) return null;

  const privyWallet = wallets.find(
    (wallet) => wallet.walletClientType === "privy",
  );
  const externalWallets = wallets.filter(
    (wallet) => wallet.walletClientType !== "privy",
  );
  const currentWallet =
    selectedWalletType === "privy" ? privyWallet : externalWallets[0];

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <div className="mb-4">
        <label className="mb-2 block">ウォレットの選択:</label>
        <select
          value={selectedWalletType}
          onChange={(e) =>
            setSelectedWalletType(e.target.value as "privy" | "external")
          }
          className="border rounded p-2"
        >
          <option value="privy">GitHubから生成されたウォレット</option>
          {externalWallets.length > 0 && (
            <option value="external">接続済みウォレット（MetaMaskなど）</option>
          )}
        </select>

        {/* 外部ウォレット追加ボタン */}
        {externalWallets.length === 0 && (
          <button
            onClick={handleConnectWallet}
            className="ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            外部ウォレットを接続
          </button>
        )}
      </div>

      <div className="mt-4">
        <p>
          選択中のウォレット:{" "}
          {selectedWalletType === "privy" ? "GitHub生成" : "外部ウォレット"}
        </p>
        <p>アドレス: {currentWallet?.address}</p>
        <p>チェーンID: {chainId}</p>
      </div>

      {/* 接続済みウォレット一覧 */}
      <div className="mt-4">
        <h3 className="font-bold">接続済みウォレット:</h3>
        <ul className="mt-2">
          {privyWallet && (
            <li className="mb-2">
              <span className="font-medium">GitHub生成ウォレット: </span>
              <span className="text-sm">{privyWallet.address}</span>
            </li>
          )}
          {externalWallets.map((wallet, index) => (
            <li key={wallet.address} className="mb-2">
              <span className="font-medium">外部ウォレット {index + 1}: </span>
              <span className="text-sm">{wallet.address}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* デバッグ情報 */}
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h3 className="text-sm font-bold">デバッグ情報:</h3>
        <pre className="text-xs mt-2 overflow-auto">
          {JSON.stringify(
            {
              availableWallets: wallets.map((w) => ({
                type: w.walletClientType,
                address: w.address,
              })),
              selectedType: selectedWalletType,
            },
            null,
            2,
          )}
        </pre>
      </div>
    </div>
  );
}
