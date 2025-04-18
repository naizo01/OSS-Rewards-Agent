"use client";

import { useState, useEffect } from "react";
import {
  usePrivy,
  getAccessToken,
  useLoginWithOAuth,
} from "@privy-io/react-auth";
import Header from "@/components/Header";
import { InitialView } from "@/components/claim/InitialView";
import { ConnectedView } from "@/components/claim/ConnectedView";
import { ClaimedView } from "@/components/claim/ClaimedView";
import { AlertCircle } from "lucide-react";
import { useGitHubIssueReward } from "@/hooks/useGitHubIssueReward";
import type { ClaimState } from "@/types/claim";
import type { Issue } from "@/types/issue";
import useRewards from "@/hooks/useRewards";
import { Spinner } from "@/components/Spinner";

export default function ClaimPage() {
  const { authenticated, ready } = usePrivy();
  const { initOAuth } = useLoginWithOAuth();
  const [state, setState] = useState<ClaimState>({
    status: "loading",
    reward: null,
    totalAmount: 0,
  });
  const [signature, setSignature] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [targetIssue, setTargetIssue] = useState<Issue | null>(null);
  const [rewards, setRewards] = useState<Issue[]>([]);
  const [issueId, setIssueId] = useState<number | null>(null);
  const { getRewards } = useRewards({
    onSuccess: (rewards) => {
      setRewards(rewards);
    },
  });

  useEffect(() => {
    getRewards();
  }, []);

  useEffect(() => {
    // クエリパラメータからissueIdを取得してステートに保存
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryIssueId = params.get("id");
      if (queryIssueId) {
        setIssueId(Number(queryIssueId));
      }
    }
  }, []);

  useEffect(()=>{
    if(!authenticated){
      setState({ ...state, status: "initial" })
    }
  }, [authenticated]);

  useEffect(() => {
    if (rewards.length > 0 && issueId !== null) {
      const foundIssue = rewards.find((issue) => issue.id === issueId);
      setTargetIssue(foundIssue as Issue);
    }
  }, [rewards, issueId]);

  const handleConnectGithub = () => {
    initOAuth({ provider: "github" });
  };

  useEffect(() => {
    if (authenticated) {
      const fetchData = async () => {
        const accessToken = await getAccessToken();

        const response = await fetch("/api/verify-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ message: "User logged in" }),
        });

        const data = await response.json();
        console.log(data);
        setSignature(data.signature);
        setUsername(data.username);
      };

      fetchData();

      setState({
        ...state,
        status: "connected",
        reward: targetIssue,
        totalAmount: 150,
      });
    }
  }, [authenticated, targetIssue]);

  const { claim, isConfirming, error } = useGitHubIssueReward();

  const handleClaimRewards = async () => {
    try {
      await claim(
        targetIssue?.repo as string,
        parseInt(String(targetIssue?.issueId) as string),
        username,
        signature as string
      );
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (isConfirming) {
      setState({ ...state, status: "claimed" });
    }
    if (error) {
      setState({
        ...state,
        status: "error",
        errorMessage: "Failed to claim rewards",
      });
    }
  }, [isConfirming, error]);

  const handleReset = () => {
    setState({ status: "connected", reward: targetIssue, totalAmount: 0 });
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
          {!ready ? (
            <div className="flex justify-center items-center h-64">
              <Spinner />
            </div>
          ) : (
            <>
              {state.status === "loading" && (
                <div className="flex justify-center items-center h-64">
                  <Spinner />
                </div>
              )}
              {state.status === "initial" && (
                <InitialView onConnect={handleConnectGithub} />
              )}

              {state.status === "connected" && (
                <ConnectedView
                  reward={state.reward as Issue}
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
                  <p className="break-words">{error?.message}</p>
                </div>
              )}
            </>
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
