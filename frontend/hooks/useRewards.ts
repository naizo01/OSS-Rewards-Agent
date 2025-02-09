import { useCallback, useState } from 'react';
import { API_URL } from "../constants/config";
import type { Issue } from "@/types/issue";
import { issues } from "@/constants/issues"; // Import the issues

type useRewardsResponse = {
  rewards?: Issue[];
  error?: Error;
  getRewards: () => void;
  isLoading: boolean;
};

type useRewardsProps = {
  onSuccess: (issues: Issue[]) => void;
};

export default function useRewards({
  onSuccess,
}: useRewardsProps): useRewardsResponse {
  const [isLoading, setIsLoading] = useState(false);

  const getRewards = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/rewards`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }

      const { rewards } = await response.json();

      // Transform the rewards data to match the Issue type
      const transformedRewards: Issue[] = rewards.map((reward: any) => ({
        id: reward[3], // Assuming this is the global ID
        issueId: reward[1], // Issue ID within the repository
        title: reward[5], // Default title for issues without a title
        status: "Open", // Assuming all rewards are for open issues
        donations: reward[2], // Reward amount
        repo: reward[0], // Repository name
        description: reward[6],
      }));

      // Concatenate the issues array to the transformed rewards
      const combinedRewards = [...transformedRewards, ...issues];

      onSuccess(combinedRewards);

      return { rewards: combinedRewards, error: null };
    } catch (error) {
      console.error('Error fetching rewards:', error);
      return { rewards: [], error: error as Error };
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess]);

  return { getRewards, isLoading };
}