export type ClaimStatus = "initial" | "connected" | "claimed" | "error";

export interface Reward {
  issueId: number;
  issueTitle: string;
  amount: number;
}

export interface ClaimState {
  status: ClaimStatus;
  rewards: Reward[];
  totalAmount: number;
  errorMessage?: string;
}
