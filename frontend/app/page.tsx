"use client";

import Header from "@/components/Header";
import Link from "next/link";
import Image from "next/image";
import {
  GitGraphIcon as GitIssue,
  GitPullRequest,
  PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const issues = [
  {
    id: 101,
    title: "Fix bug in login",
    status: "Open",
    donations: 100,
    repo: "org/repo-a",
  },
  {
    id: 102,
    title: "Implement new feature",
    status: "In Progress",
    donations: 250,
    repo: "org/repo-a",
  },
  {
    id: 201,
    title: "Improve performance",
    status: "Open",
    donations: 50,
    repo: "org/repo-b",
  },
  {
    id: 202,
    title: "Update documentation",
    status: "Open",
    donations: 30,
    repo: "org/repo-b",
  },
  {
    id: 301,
    title: "Refactor authentication system",
    status: "Open",
    donations: 150,
    repo: "org/repo-c",
  },
  {
    id: 401,
    title: "Add dark mode support",
    status: "Open",
    donations: 0,
    repo: "org/repo-d",
  },
  {
    id: 402,
    title: "Implement CI/CD pipeline",
    status: "Open",
    donations: 0,
    repo: "org/repo-d",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto p-4 max-w-5xl">
        {/* OSS Rewards Section */}
        <section className="mb-12 border-b pb-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/2">
              <h1 className="text-3xl font-semibold mb-4">OSS Rewards</h1>
              <p className="text-xl mb-6 text-gray-600">
                Support open-source projects and get rewarded for your
                contributions!
              </p>
              <div className="flex space-x-4">
                <a
                  href="#issues"
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
                >
                  Explore Issues
                </a>
                <a
                  href="#how-it-works"
                  className="text-green-600 hover:text-green-700 font-medium py-2 px-4 border border-green-600 rounded-md"
                >
                  How It Works
                </a>
              </div>
            </div>
            <div className="md:w-1/2">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/991%20(1)-TgrfqX3hHCnYNCRzrH7MJ3vQDIqDX4.png"
                alt="OSS Rewards Platform"
                width={500}
                height={400}
                className="w-full h-auto"
              />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="mb-12 border-b pb-8">
          <h2 className="text-2xl font-semibold mb-8 text-center">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/735-TbKTuaLG6I5uq0fYElIfACnLFnzVL9.png"
                  alt="Choose an Issue"
                  width={200}
                  height={200}
                  className="w-auto h-40"
                />
              </div>
              <h3 className="font-medium mb-2">Choose an Issue</h3>
              <p className="text-gray-600">
                Browse through open issues and find ones you'd like to support
                or work on.
              </p>
            </div>
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/985%20(1)-aNd0pCDGOm5s5BbzEkPhHtcNMChjYy.png"
                  alt="Make a Donation"
                  width={200}
                  height={200}
                  className="w-auto h-40"
                />
              </div>
              <h3 className="font-medium mb-2">Make a Donation</h3>
              <p className="text-gray-600">
                Contribute funds to issues you believe are important.
              </p>
            </div>
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/751-250hwYDyPOfr2FrcPjwERC2gAyQ86c.png"
                  alt="Get Rewarded"
                  width={200}
                  height={200}
                  className="w-auto h-40"
                />
              </div>
              <h3 className="font-medium mb-2">Get Rewarded</h3>
              <p className="text-gray-600">
                Solve issues and claim rewards for your contributions.
              </p>
            </div>
          </div>
        </section>

        {/* Issues Section */}
        <section id="issues" className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Open Issues</h2>
            <Link href="/issue">
              <Button className="bg-green-600 hover:bg-green-700">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Issue
              </Button>
            </Link>
          </div>
          <div className="space-y-4">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className="border rounded-md p-4 hover:bg-gray-50"
              >
                <div className="flex items-start">
                  <div className="mr-3 mt-1">
                    {issue.status === "Open" ? (
                      <GitIssue className="text-green-600" size={20} />
                    ) : (
                      <GitPullRequest className="text-purple-600" size={20} />
                    )}
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-lg font-medium mb-1">
                      <Link
                        href={`/issue/${issue.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {issue.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {issue.repo} •{" "}
                      {issue.donations > 0
                        ? `$${issue.donations} in donations`
                        : "No donations yet"}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          issue.status === "Open"
                            ? "bg-green-100 text-green-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {issue.status}
                      </span>
                      {issue.donations === 0 && (
                        <Link
                          href={`/issue/${issue.id}`}
                          className="text-sm text-green-600 hover:text-green-700 font-medium"
                        >
                          Be the first to donate
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
