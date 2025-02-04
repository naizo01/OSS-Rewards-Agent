"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { AIAgentInput } from "@/components/AIAgentInput";
import { Button } from "@/components/ui/button";
import { GitGraphIcon as GitIssue, GitPullRequest } from "lucide-react";

interface Issue {
  id: number;
  title: string;
  status: "Open" | "In Progress";
  donations: number;
  repo: string;
  description: string;
}

export default function IssuePage({ params }: { params: { id: string } }) {
  const [issue, setIssue] = useState<Issue | null>(null);

  useEffect(() => {
    // Simulating API call to fetch issue details
    const fetchIssue = async () => {
      // In a real application, you would fetch the issue data from an API
      const mockIssue: Issue = {
        id: Number.parseInt(params.id),
        title: "Fix bug in login",
        status: "Open",
        donations: 100,
        repo: "org/repo-a",
        description:
          "There's a bug in the login process that needs to be fixed.",
      };
      setIssue(mockIssue);
    };

    fetchIssue();
  }, [params.id]);

  if (!issue) {
    return <div>Loading...</div>;
  }

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
          <p className="text-gray-700 mb-4">{issue.description}</p>
          <Button className="w-full bg-green-600 hover:bg-green-700">
            Contribute to this issue
          </Button>
        </div>

        <h2 className="text-xl font-bold mb-4">Discuss and Donate</h2>
        <AIAgentInput />
      </main>
    </div>
  );
}
