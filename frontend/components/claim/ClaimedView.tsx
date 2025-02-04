"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";

interface ClaimedViewProps {
  amount: number;
  onReset: () => void;
}

export function ClaimedView({ amount, onReset }: ClaimedViewProps) {
  return (
    <div className="text-center">
      <Image
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1051-x1S5njsLE9NOy7QLRYrjqf4rGqpo38.png"
        alt="Success"
        width={120}
        height={120}
        className="mx-auto mb-4"
      />
      <h2 className="text-xl font-semibold mb-4">
        Rewards Claimed Successfully!
      </h2>
      <p className="text-gray-600 mb-6">
        Your rewards of ${amount} have been sent to your connected wallet.
      </p>
      <Button className="bg-green-600 hover:bg-green-700" onClick={onReset}>
        Back to Home
      </Button>
    </div>
  );
}
