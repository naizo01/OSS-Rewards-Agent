"use client";
import '@coinbase/onchainkit/styles.css'; 
import { Inter } from "next/font/google";
import "./globals.css";
import type React from "react";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

// export const metadata: Metadata = {
//   title: "OSS Rewards",
//   description: "Rewarding OSS contributors for their valuable work",
//   icons: {
//     icon: [
//       {
//         url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/nNnTXyPctT28YAz1738562866_1738562875-OI7hr77gSFg2tWsrJgAnHGcfAPiyVJ.png",
//         href: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/nNnTXyPctT28YAz1738562866_1738562875-OI7hr77gSFg2tWsrJgAnHGcfAPiyVJ.png",
//       },
//     ],
//   },
// };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests" />
      </head>
      <body className={inter.className}>
        {" "}
        <Providers>{children} </Providers>
      </body>
    </html>
  );
}
