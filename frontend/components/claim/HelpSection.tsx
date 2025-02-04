"use client";
import { AlertCircle } from "lucide-react";
import { CLAIM_MESSAGES } from "@/constants/claim";

export function HelpSection() {
  return (
    <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
        <div>
          <h3 className="font-medium text-blue-800 mb-1">
            {CLAIM_MESSAGES.HELP_TITLE}
          </h3>
          <p className="text-sm text-blue-600">
            {CLAIM_MESSAGES.HELP_DESCRIPTION}
          </p>
        </div>
      </div>
    </div>
  );
}
