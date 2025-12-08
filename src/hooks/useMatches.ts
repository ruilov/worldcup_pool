// src/hooks/useMatches.ts
// View-model hook for fetching and displaying matches

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { loadChallenge } from '../persistence/challenges';
import { loadMatches } from '../persistence/matches';
import type { Match } from '../domain/types';
import {
  isMatchLocked,
  formatMatchScore,
} from '../domain/match';
import { formatMatchTeamsLocalized } from '../domain/localization';

/**
 * View-model for a single match row.
 * Contains both raw match data and computed display properties.
 */
export interface MatchViewModel {
  id: string;
  matchNumber: number; // Official match number
  matchNumberDisplay: string; // "#42"
  teamsDisplay: string; // "Brazil vs Morocco"
  kickoffAt: Date | null;
  kickoffDisplay: string; // Formatted kickoff time or "TBD"
  status: string; // Match status
  scoreDisplay: string; // "2-1" or "?"
  isLocked: boolean; // Whether bets are locked
  match: Match; // Raw match data for further use
}

/**
 * Hook state and actions.
 */
interface UseMatchesResult {
  matches: MatchViewModel[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Fetch and display matches for a challenge.
 * Computes display-ready properties using domain logic.
 *
 * @param challengeId - The challenge ID (or null to skip loading)
 * @returns Matches with computed display properties
 */
export function useMatches(challengeId: string | null): UseMatchesResult {
  const { t, i18n } = useTranslation();
  const [matches, setMatches] = useState<MatchViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = async () => {
    if (!challengeId) {
      setMatches([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Load challenge to get lock time configuration
      const challenge = await loadChallenge(challengeId);
      if (!challenge) {
        throw new Error('Challenge not found');
      }

      // Load all matches for this challenge
      const rawMatches = await loadMatches(challengeId);

      // Transform to view models using domain logic
      const now = new Date();
      const viewModels: MatchViewModel[] = rawMatches.map((match) => ({
        id: match.id,
        matchNumber: match.matchNumber,
        matchNumberDisplay: `#${match.matchNumber}`,
        teamsDisplay: formatMatchTeamsLocalized(match, t),
        kickoffAt: match.kickoffAt,
        kickoffDisplay: match.kickoffAt
          ? match.kickoffAt.toLocaleString(i18n.language, {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              timeZoneName: 'short',
            })
          : t('matches.kickoffTBD'),
        status: match.status,
        scoreDisplay: formatMatchScore(match),
        isLocked: isMatchLocked(match, challenge.lockTimeHours, now),
        match, // Keep raw data for further use
      }));

      setMatches(viewModels);
    } catch (err) {
      console.error('Error fetching matches:', err);
      setError(err instanceof Error ? err.message : 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeId, i18n.language]);

  return {
    matches,
    loading,
    error,
    refetch: fetchMatches,
  };
}
