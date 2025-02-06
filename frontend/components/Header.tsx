"use client";
import Link from "next/link";
import Image from "next/image";
import {
  ConnectWallet,
  Wallet,
  ConnectWalletText,
  WalletDropdown,

  WalletDropdownLink,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import {
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from "@coinbase/onchainkit/identity";

export default function Header() {

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="container mx-auto h-16 max-w-5xl">
        <div className="flex h-full items-center justify-between px-4">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/nNnTXyPctT28YAz1738562866_1738562875-OI7hr77gSFg2tWsrJgAnHGcfAPiyVJ.png"
                alt="OSS Rewards"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span className="text-xl font-semibold text-gray-900">
                OSS Rewards
              </span>
            </Link>
            <nav className="hidden md:block">
              <ul className="flex space-x-4">
                <li>
                  <Link
                    href="/"
                    className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/claim"
                    className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100"
                  >
                    Claim
                  </Link>
                </li>
                <li>
                  <Link
                    href="/issue"
                    className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100"
                  >
                    New Issue
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Wallet>
              <ConnectWallet className="bg-gray-400 hover:bg-gray-300 h-11">
                <ConnectWalletText>Log In</ConnectWalletText>
                <Avatar className="h-4 w-4" />
                <Name />
              </ConnectWallet>
              <WalletDropdown>
                <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                  <Name />
                  <Address />
                  <EthBalance />
                </Identity>
                <WalletDropdownLink
                  icon="wallet"
                  href="https://keys.coinbase.com"
                >
                  Wallet
                </WalletDropdownLink>
                <WalletDropdownDisconnect />
              </WalletDropdown>
            </Wallet>{" "}
            {/* <Button
              onClick={authenticated ? logout : login}
              variant="default"
              className="bg-green-600 hover:bg-green-700"
            >
              {authenticated ? "Logout" : "Login"}
            </Button> */}
          </div>
        </div>
      </div>
    </header>
  );
}
