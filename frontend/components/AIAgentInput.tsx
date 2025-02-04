"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useChat from "../hooks/useChat";
import type { AgentMessage, StreamEntry } from "../types/types";
import { generateUUID, markdownToPlainText } from "../lib/utils";
import SendSvg from "./svg/SendSvg";
import TimeDisplay from "./TimeDisplay";

export function AIAgentInput({ initialMessage }: { initialMessage?: string }) {
  const [userInput, setUserInput] = useState("");
  const [streamEntries, setStreamEntries] = useState<StreamEntry[]>([]);

  const conversationId = useMemo(() => {
    return generateUUID();
  }, []);

  const bottomRef = useRef<HTMLDivElement>(null);

  const handleSuccess = useCallback((messages: AgentMessage[]) => {
    let message = messages.find((res) => res.event === "agent");
    if (!message) {
      message = messages.find((res) => res.event === "tools");
    }
    if (!message) {
      message = messages.find((res) => res.event === "error");
    }
    const streamEntry: StreamEntry = {
      timestamp: new Date(),
      content: markdownToPlainText(message?.data || ""),
      type: "agent",
    };
    setStreamEntries((prev) => [...prev, streamEntry]);
  }, []);

  const { postChat, isLoading } = useChat({
    onSuccess: handleSuccess,
    conversationId,
  });

  useEffect(() => {
    const initialStreamEntry: StreamEntry = {
      timestamp: new Date(),
      type: "user",
      content: initialMessage,
    };
    // setStreamEntries((prev) => [...prev, initialStreamEntry]);
    postChat(initialMessage);
  }, []);

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
    [postChat, userInput],
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setUserInput(e.target.value);
    },
    [setUserInput],
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
      </div>
      <div className="mt-3" ref={bottomRef} />

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
