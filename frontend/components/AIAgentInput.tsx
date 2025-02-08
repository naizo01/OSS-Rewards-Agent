"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useChat from "../hooks/useChat";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import type { AgentMessage, StreamEntry } from "../types/types";
import { generateUUID, markdownToPlainText } from "../lib/utils";
import SendSvg from "./svg/SendSvg";
import TimeDisplay from "./TimeDisplay";
import { Spinner } from "./Spinner";
import SignButton from "./SignButton";
export function AIAgentInput({ initialMessage }: { initialMessage?: string }) {
  const { user, ready, authenticated, login } = usePrivy();
  console.log(user)
  const { address } = useAccount();

  const [userInput, setUserInput] = useState("");
  const [streamEntries, setStreamEntries] = useState<StreamEntry[]>([]);
  const conversationId = useMemo(() => {
    return generateUUID();
  }, []);

  const bottomRef = useRef<HTMLDivElement>(null);

  const [hasPostedInitialMessage, setHasPostedInitialMessage] = useState(false);

  const [jsonData, setJsonData] = useState<any>(null);

  // JSONデータを検出して解析する関数
  const extractJsonData = (content: string) => {
    // 改行を削除し、複数の空白を1つのスペースに変換
    const sanitizedContent = content.replace(/\n/g, "").replace(/\s+/g, " ");
    const jsonStartIndex = sanitizedContent.indexOf('{ "repositoryName":');
    if (jsonStartIndex !== -1) {
      try {
        // JSONデータを抽出
        const jsonString = sanitizedContent.substring(jsonStartIndex).trim();
        const jsonEndIndex = jsonString.lastIndexOf("}");
        if (jsonEndIndex !== -1) {
          const completeJsonString = jsonString.substring(0, jsonEndIndex + 1);
          console.log("Extracted JSON String:", completeJsonString);
          return JSON.parse(completeJsonString);
        }
      } catch (error) {
        console.error("Invalid JSON format:", error);
      }
    }
    return null;
  };

  const handleSuccess = useCallback((messages: AgentMessage[]) => {
    let message = messages.find((res) => res.event === "agent");
    if (!message) {
      message = messages.find((res) => res.event === "tools");
    }
    if (!message) {
      message = messages.find((res) => res.event === "error");
    }

    const content = markdownToPlainText(message?.data || "");
    // JSONデータの検出とステートへの保存
    const parsedJson = extractJsonData(content || "");
    if (parsedJson) {
      setJsonData(parsedJson);
    }

    const streamEntry: StreamEntry = {
      timestamp: new Date(),
      content: content,
      type: "agent",
    };
    setStreamEntries((prev) => [...prev, streamEntry]);
  }, []);

  const { postChat, isLoading } = useChat({
    onSuccess: handleSuccess,
    conversationId,
  });

  //   useEffect(() => {
  //     const jsonData = extractJsonData(`AI: Thank you for providing all the necessary information. Here's a summary of the data collected: - Repository Name: kmtr/forge-runjson-utils - Issue ID: 1 - Amount: 10 USD - User Address: 0x694415AF0316dD976993B3cfB79cE1991853139d Now, I will prepare the data in JSON format for you to sign. The token address is predefined, and I will include it in the JSON. Here's the JSON data: json { "repositoryName": "kmtr/forge-runjson-utils", "issueId": 1, "reward": 10, "tokenAddress": "0xYourTokenAddressHere", "userAddress": "0x694415AF0316dD976993B3cfB79cE1991853139d" } Please replace "0xYourTokenAddressHere" with the actual token address before signing. Once you have prepared to sign the JSON data, please let me know, and I will proceed with the transaction.
  // `);
  //     setJsonData(jsonData);

  //     console.log("jsonData", jsonData);
  //   }, []);

  useEffect(() => {
    if (!authenticated && ready) {
      login();
    }
  }, [ready, authenticated]);

  useEffect(() => {
    if (authenticated && address && !hasPostedInitialMessage) {
      const message = initialMessage + `my Ethereum address  is: ${address}`;
      postChat(message || "");
      setHasPostedInitialMessage(true);
    }
  }, [
    authenticated,
    initialMessage,
    address,
    postChat,
    hasPostedInitialMessage,
  ]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!userInput.trim()) {
        return;
      }

      setUserInput("");

      const userMessage: StreamEntry = {
        timestamp: new Date(),
        type: "user",
        content: userInput.trim(),
      };

      setStreamEntries((prev) => [...prev, userMessage]);

      postChat(userInput);
    },
    [postChat, userInput]
  );

  const handleUserInputSubmit = useCallback(
    async (input: string) => {
      if (!input.trim()) {
        return;
      }

      setUserInput("");

      const userMessage: StreamEntry = {
        timestamp: new Date(),
        type: "user",
        content: input.trim(),
      };

      setStreamEntries((prev) => [...prev, userMessage]);

      postChat(input);
      setJsonData(null);
    },
    [postChat]
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setUserInput(e.target.value);
    },
    [setUserInput]
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [streamEntries]);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="mb-6 h-64 overflow-y-auto border rounded-md p-4">
        {streamEntries.map((entry, index) => (
          <div className="mb-2" key={`${entry.timestamp.getTime()}-${index}`}>
            <TimeDisplay timestamp={entry.timestamp} />
            <div
              className={`mb-4 ${
                entry.type === "agent" ? "text-blue-600" : "text-green-600"
              }`}
            >
              <strong>{entry.type === "agent" ? "AI: " : "You: "}</strong>
              {entry.content}
            </div>
          </div>
        ))}
        {jsonData && (
          <SignButton
            jsonData={jsonData}
            setUserInput={setUserInput}
            handleSubmit={(input: string) => handleUserInputSubmit(input)}
          />
        )}
        {isLoading && (
          <div className="flex justify-center items-center mt-3">
            <Spinner />
          </div>
        )}
        <div className="mt-3" ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-auto flex w-full flex-col border-gray-300 border-t bg-white p-4 pb-2 md:mt-0"
      >
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <textarea
              value={userInput}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="h-14 w-full bg-white p-2 pr-10 text-gray-800 placeholder-gray-500 placeholder-opacity-50 lg:h-36"
              placeholder="How can I help?"
              rows={1}
            />
            <button
              type="submit"
              disabled={!/[a-zA-Z]/.test(userInput)}
              className={`mt-auto rounded-sm p-1.5 transition-colors xl:hidden ${
                /[a-zA-Z]/.test(userInput)
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "cursor-not-allowed bg-green-600 text-white opacity-50"
              }`}
            >
              <SendSvg />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
