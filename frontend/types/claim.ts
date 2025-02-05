import type { Issue } from "@/types/issue";

export type ClaimStatus = "initial" | "connected" | "claimed" | "error";

export interface Reward {
  issueId: number;
  issueTitle: string;
  amount: number;
}

export interface ClaimState {
  status: ClaimStatus;
  reward: Issue | null;
  totalAmount: number;
  errorMessage?: string;
}
