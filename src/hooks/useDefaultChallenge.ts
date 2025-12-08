// src/hooks/useDefaultChallenge.ts
// Hook to load the default challenge

import { useState, useEffect } from 'react';
import { loadChallengeByCode } from '../persistence/challenges';
import type { Challenge } from '../domain/types';

/**
 * Load the default challenge by code.
 * Useful for apps that only have one challenge.
 */
export function useDefaultChallenge() {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        setLoading(true);
        const defaultChallenge = await loadChallengeByCode('default');
        setChallenge(defaultChallenge);
      } catch (err) {
        console.error('Error loading default challenge:', err);
        setError(err instanceof Error ? err.message : 'Failed to load challenge');
      } finally {
        setLoading(false);
      }
    };

    fetchChallenge();
  }, []);

  return { challenge, loading, error };
}
