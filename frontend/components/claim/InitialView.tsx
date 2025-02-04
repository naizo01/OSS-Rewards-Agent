"use client";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";

interface InitialViewProps {
  onConnect: () => void;
}

export function InitialView({ onConnect }: InitialViewProps) {
  return (
    <div className="text-center">
      <Github className="mx-auto h-16 w-16 text-gray-400 mb-4" />
      <h2 className="text-xl font-semibold mb-4">
        Connect your GitHub Account
      </h2>
      <p className="text-gray-600 mb-6">
        Connect your GitHub account to verify your contributions and claim your
        rewards.
      </p>
      <Button onClick={onConnect} className="bg-green-600 hover:bg-green-700">
        <Github className="mr-2 h-4 w-4" /> Connect GitHub Account
      </Button>
    </div>
  );
}
