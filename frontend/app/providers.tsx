// src/app/providers.tsx
"use client";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type PropsWithChildren } from "react";
import { wagmiConfig } from "../lib/wagmiConfig";
import { baseSepolia } from "viem/chains";
const queryClient = new QueryClient();

// src/app/providers.tsx
export default function Providers({ children }: PropsWithChildren) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? ""}
      clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID ?? ""}
      config={{
        loginMethods: ["github", "wallet"], // walletを追加して外部ウォレット接続を有効化
        appearance: {
          theme: "light",
          accentColor: "#676FFF",
          walletList: ["coinbase_wallet"],
          showWalletLoginFirst: true,
        },
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
        },
        defaultChain: baseSepolia,
        externalWallets: {
          coinbaseWallet: {
            // Valid connection options include 'all' (default), 'eoaOnly', or 'smartWalletOnly'
            connectionOptions: "smartWalletOnly",
          },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
