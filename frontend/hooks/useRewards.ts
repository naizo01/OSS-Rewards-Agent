import { useCallback, useState } from 'react';
import type { Address } from 'viem';
import { API_URL } from "../constants/config";

type useRewardsResponse = {
  rewards?: Address[];
  error?: Error;
  getRewards: () => void;
  isLoading: boolean;
};

type useRewardsProps = {
  onSuccess: (addresses: Address[]) => void;
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

      onSuccess(rewards);

      return { rewards, error: null };
    } catch (error) {
      console.error('Error fetching rewards:', error);
      return { rewards: [], error: error as Error };
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess]);

  return { getRewards, isLoading };
}
