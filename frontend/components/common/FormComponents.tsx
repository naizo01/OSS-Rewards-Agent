// src/components/common/FormComponents.tsx
"use client";

import { InputHTMLAttributes } from "react";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function InputField({ label, ...props }: InputFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input {...props} className="w-full p-2 border rounded-md" />
    </div>
  );
}

interface TransactionButtonProps {
  isPending: boolean;
  isConfirming: boolean;
}

export function TransactionButton({
  isPending,
  isConfirming,
}: TransactionButtonProps) {
  return (
    <button
      type="submit"
      disabled={isPending || isConfirming}
      className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
    >
      {isPending ? "Submitting..." : isConfirming ? "Confirming..." : "Submit"}
    </button>
  );
}

interface TransactionStatusProps {
  error: Error | null;
  hash?: `0x${string}` | null; // hashの型を修正
}

export function TransactionStatus({ error, hash }: TransactionStatusProps) {
  return (
    <>
      {error && (
        <div className="text-red-500 text-sm mt-2">Error: {error.message}</div>
      )}
      {hash && (
        <div className="text-green-500 text-sm mt-2">
          Transaction submitted: {hash}
        </div>
      )}
    </>
  );
}
