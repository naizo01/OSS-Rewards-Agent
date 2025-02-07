"use client";
import Image from "next/image";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Issue } from "@/types/issue";

interface ConnectedViewProps {
  reward: Issue;
  onClaim: () => void;
}

export function ConnectedView({ reward, onClaim }: ConnectedViewProps) {
  const { logout } = usePrivy();

  return (
    <div>
      <div className="text-center mb-6">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/6-Fz2g4cbqaXbpgRracqssijMsZ31FZB.png"
          alt="Connected"
          width={100}
          height={100}
          className="mx-auto mb-4"
        />
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">
            Your GitHub account has been successfully connected!
          </AlertDescription>
        </Alert>
      </div>
      <h2 className="text-xl font-semibold mb-4">Available Rewards</h2>
      {reward ? (
        <>
          <p className="text-gray-600 mb-2">
            You have the following rewards available to claim:
          </p>
          <ul className="list-disc list-inside mb-6 text-gray-600">
            <li key={reward.id}>
              {reward.title} (#{reward.issueId}): ${reward.donations}
            </li>
          </ul>
          <Button
            onClick={onClaim}
            className="w-full bg-green-600 hover:bg-green-700 mb-4"
          >
            Claim Rewards
          </Button>
        </>
      ) : (
        <p className="text-gray-600 mb-6">
          No rewards available to claim at this time.
        </p>
      )}
      <div className="flex justify-center">
        <Button
          onClick={logout}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm px-4 py-2"
        >
          Logout
        </Button>
      </div>
    </div>
  );
}
