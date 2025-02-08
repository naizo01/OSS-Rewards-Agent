"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { AIAgentInput } from "@/components/AIAgentInput";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/Spinner";
import { GitGraphIcon as GitIssue, GitPullRequest } from "lucide-react";
import type { Issue } from "@/types/issue";
import useRewards from "@/hooks/useRewards";

export default function IssuePage({ params }: { params: { id: string } }) {
  const [rewards, setRewards] = useState<Issue[]>([]);

  const [issue, setIssue] = useState<Issue | null>(null);
  const { getRewards } = useRewards({
    onSuccess: (rewards) => {
      setRewards(rewards);
    },
  });
  useEffect(() => {
    getRewards();
  }, []);
  useEffect(() => {
    if (rewards.length > 0) {
      const foundIssue = rewards.find(
        (issue) => issue.id === Number(params.id)
      );
      setIssue(foundIssue as Issue);
    }
  }, [rewards, params.id]);

  if (!issue) {
    return (
      <div className="flex justify-center items-center h-64">
        {" "}
        <Spinner />
      </div>
    );
  }

  const initialMessage = `I will execute the reward lock process. Could you please provide the donation amount in USD? Here is the information we have: repositoryName: https://github.com/${issue.repo}, issueId: ${issue.issueId}.`;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto p-4 max-w-3xl">
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-start mb-4">
            <div className="mr-3 mt-1">
              {issue.status === "Open" ? (
                <GitIssue className="text-green-600" size={24} />
              ) : (
                <GitPullRequest className="text-purple-600" size={24} />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">{issue.title}</h1>
              <p className="text-gray-600 mb-2">
                {issue.repo} • ${issue.donations} in donations
              </p>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  issue.status === "Open"
                    ? "bg-green-100 text-green-800"
                    : "bg-purple-100 text-purple-800"
                }`}
              >
                {issue.status}
              </span>
            </div>
          </div>
          <Button className="w-full bg-green-600 hover:bg-green-700">
            Contribute to this issue
          </Button>
        </div>

        <h2 className="text-xl font-bold mb-3">Discuss and Donate</h2>
        <p className="text-lg mb-3">
          Interact with the AI agent to donate and execute transactions for
          open-source project issues.
        </p>
        <AIAgentInput initialMessage={initialMessage} />
      </main>
    </div>
  );
}
