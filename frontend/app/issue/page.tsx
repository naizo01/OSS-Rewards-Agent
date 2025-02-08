"use client";

import Header from "@/components/Header";
import { AIAgentInput } from "@/components/AIAgentInput";

export default function AddIssuePage() {
  const initialMessage = `I will execute the reward lock process. Please provide the following information in sequence: the repository name, the issue ID, and the amount. Let's start with the repository name. Could you please provide it?`;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto p-4 max-w-3xl">
        <h1 className="text-3xl font-bold mb-3">Add New Issue</h1>

        <p className="text-lg mb-6">
          Interact with the AI agent to donate and execute transactions for
          open-source project issues.
        </p>

        <AIAgentInput initialMessage={initialMessage} />
      </main>
    </div>
  );
}
