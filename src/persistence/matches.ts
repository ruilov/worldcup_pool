// src/persistence/matches.ts
// Supabase persistence for matches

import { supabase } from '../supabaseClient';
import type { Match } from '../domain/types';

/**
 * Database row type for matches table.
 * Maps snake_case DB columns to our domain.
 */
interface MatchRow {
  id: string;
  match_number: number;
  team1_name: string;
  team2_name: string;
  kickoff_at: string | null;
  score_team1: number | null;
  score_team2: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Convert a database row to a domain Match object.
 */
function rowToMatch(row: MatchRow): Match {
  return {
    id: row.id,
    matchNumber: row.match_number,
    team1Name: row.team1_name,
    team2Name: row.team2_name,
    kickoffAt: row.kickoff_at ? new Date(row.kickoff_at) : null,
    scoreTeam1: row.score_team1,
    scoreTeam2: row.score_team2,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Load all matches for a challenge.
 *
 * @param _challengeId - The challenge ID (currently unused; matches are global)
 * @returns Array of matches, ordered by match number
 * @throws Error if database query fails
 */
export async function loadMatches(_challengeId: string): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .order('match_number', { ascending: true });

  if (error) {
    console.error('Error loading matches:', error);
    throw new Error(`Failed to load matches: ${error.message}`);
  }

  return (data || []).map(rowToMatch);
}

/**
 * Load a single match by ID.
 *
 * @param matchId - The match ID
 * @returns Match or null if not found
 * @throws Error if database query fails
 */
export async function loadMatch(matchId: string): Promise<Match | null> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single();

  if (error) {
    console.error('Error loading match:', error);
    throw new Error(`Failed to load match: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return rowToMatch(data);
}

/**
 * Update the score for a match.
 *
 * @param matchId - Match ID
 * @param scoreTeam1 - Goals for team 1 (null to clear)
 * @param scoreTeam2 - Goals for team 2 (null to clear)
 */
export async function updateMatchScore(
  matchId: string,
  scoreTeam1: number | null,
  scoreTeam2: number | null,
): Promise<void> {
  const { error } = await supabase
    .from('matches')
    .update({
      score_team1: scoreTeam1,
      score_team2: scoreTeam2,
    })
    .eq('id', matchId);

  if (error) {
    console.error('Error updating match score:', error);
    throw new Error(`Failed to update match score: ${error.message}`);
  }
}
