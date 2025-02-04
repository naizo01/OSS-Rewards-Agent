"use client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Reward } from "@/types/claim";

interface ConnectedViewProps {
  rewards: Reward[];
  totalAmount: number;
  onClaim: () => void;
}

export function ConnectedView({
  rewards,
  totalAmount,
  onClaim,
}: ConnectedViewProps) {
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
      <p className="text-gray-600 mb-2">
        You have the following rewards available to claim:
      </p>
      <ul className="list-disc list-inside mb-6 text-gray-600">
        {rewards.map((reward) => (
          <li key={reward.issueId}>
            {reward.issueTitle} (#{reward.issueId}): ${reward.amount}
          </li>
        ))}
      </ul>
      <p className="text-lg font-semibold mb-6">
        Total available: ${totalAmount}
      </p>
      <Button
        onClick={onClaim}
        className="w-full bg-green-600 hover:bg-green-700"
      >
        Claim Rewards (${totalAmount})
      </Button>
    </div>
  );
}
