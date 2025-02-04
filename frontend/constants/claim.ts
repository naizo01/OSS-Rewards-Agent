interface Reward {
  issueId: number;
  issueTitle: string;
  amount: number;
}

export const CLAIM_MESSAGES = {
  TITLE: "Claim Your Rewards",
  SUBTITLE:
    "Connect your GitHub account to claim rewards for your contributions.",
  CONNECT_TITLE: "Connect your GitHub Account",
  CONNECT_DESCRIPTION:
    "Connect your GitHub account to verify your contributions and claim your rewards.",
  SUCCESS_MESSAGE: "Your GitHub account has been successfully connected!",
  REWARDS_TITLE: "Available Rewards",
  REWARDS_DESCRIPTION: "You have the following rewards available to claim:",
  CLAIMED_TITLE: "Rewards Claimed Successfully!",
  HELP_TITLE: "Need Help?",
  HELP_DESCRIPTION:
    "Make sure you have completed your contributions and the issues are marked as resolved before claiming your rewards. If you encounter any issues, please contact our support team.",
} as const;

export const MOCK_REWARDS: Reward[] = [
  { issueId: 101, issueTitle: "Fix bug in login", amount: 100 },
  { issueId: 201, issueTitle: "Improve performance", amount: 50 },
];
