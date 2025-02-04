"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { InitialView } from "@/components/claim/InitialView";
import { ConnectedView } from "@/components/claim/ConnectedView";
import { ClaimedView } from "@/components/claim/ClaimedView";
import { AlertCircle } from "lucide-react";
import type { ClaimState } from "@/types/claim";

const MOCK_REWARDS = [
  { issueId: 101, issueTitle: "Fix bug in login", amount: 100 },
  { issueId: 201, issueTitle: "Improve performance", amount: 50 },
];

export default function ClaimPage() {
  const [state, setState] = useState<ClaimState>({
    status: "initial",
    rewards: [],
    totalAmount: 0,
  });

  const handleConnectGithub = async () => {
    try {
      setState({
        ...state,
        status: "connected",
        rewards: MOCK_REWARDS,
        totalAmount: 150,
      });
    } catch (error) {
      setState({
        ...state,
        status: "error",
        errorMessage: "Failed to connect to GitHub",
      });
    }
  };

  const handleClaimRewards = async () => {
    try {
      setState({ ...state, status: "claimed" });
    } catch (error) {
      setState({
        ...state,
        status: "error",
        errorMessage: "Failed to claim rewards",
      });
    }
  };

  const handleReset = () => {
    setState({ status: "initial", rewards: [], totalAmount: 0 });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto p-4 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Claim Your Rewards</h1>
          <p className="text-gray-600">
            Connect your GitHub account to claim rewards for your contributions.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          {state.status === "initial" && (
            <InitialView onConnect={handleConnectGithub} />
          )}

          {state.status === "connected" && (
            <ConnectedView
              rewards={state.rewards}
              totalAmount={state.totalAmount}
              onClaim={handleClaimRewards}
            />
          )}

          {state.status === "claimed" && (
            <ClaimedView amount={state.totalAmount} onReset={handleReset} />
          )}

          {state.status === "error" && (
            <div className="text-center text-red-600">
              <p>{state.errorMessage}</p>
              <button
                onClick={handleReset}
                className="mt-4 text-blue-600 hover:underline"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
            <div>
              <h3 className="font-medium text-blue-800 mb-1">Need Help?</h3>
              <p className="text-sm text-blue-600">
                Make sure you have completed your contributions and the issues
                are marked as resolved before claiming your rewards. If you
                encounter any issues, please contact our support team.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
