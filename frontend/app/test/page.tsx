// src/app/test/page.tsx
"use client";

import { useState } from "react";
import LockReward from "@/components/test/LockReward";
import RegisterIssue from "@/components/test/RegisterIssue";
import LinkGitHub from "@/components/test/LinkGitHub";
import ClaimReward from "@/components/test/ClaimReward";
import ApproveToken from "@/components/test/ApproveToken";
export default function TestPage() {
  const [activeTab, setActiveTab] = useState("lock");

  const tabs = [
    { id: "lock", label: "Lock Reward" },
    { id: "register", label: "Register Issue" },
    { id: "link", label: "Link GitHub" },
    { id: "claim", label: "Claim Reward" },
    { id: "approve", label: "Approve Token" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "lock":
        return <LockReward />;
      case "register":
        return <RegisterIssue />;
      case "link":
        return <LinkGitHub />;
      case "claim":
        return <ClaimReward />;
      case "approve":
        return <ApproveToken />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">GitHub Issue Reward Test Page</h1>

      <div className="mb-6">
        <div className="border-b">
          <nav className="flex space-x-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-4 ${
                  activeTab === tab.id
                    ? "border-b-2 border-blue-500 text-blue-500"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">{renderContent()}</div>
    </div>
  );
}
