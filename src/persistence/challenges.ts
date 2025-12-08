// src/persistence/challenges.ts
// Supabase persistence for challenges

import { supabase } from '../supabaseClient';
import type { Challenge } from '../domain/types';

/**
 * Database row type for challenges table.
 * Maps snake_case DB columns to our domain.
 */
interface ChallengeRow {
  id: string;
  code: string;
  name: string;
  default_language: string;
  lock_time_hours: number;
  created_at: string;
}

/**
 * Convert a database row to a domain Challenge object.
 */
function rowToChallenge(row: ChallengeRow): Challenge {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    defaultLanguage: row.default_language,
    lockTimeHours: row.lock_time_hours,
    createdAt: new Date(row.created_at),
  };
}

/**
 * Load a challenge by its ID.
 *
 * @param challengeId - The challenge ID
 * @returns Challenge or null if not found
 * @throws Error if database query fails
 */
export async function loadChallenge(challengeId: string): Promise<Challenge | null> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', challengeId)
    .single();

  if (error) {
    console.error('Error loading challenge:', error);
    throw new Error(`Failed to load challenge: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return rowToChallenge(data);
}

/**
 * Load a challenge by its code (e.g., "default").
 *
 * @param code - The challenge code
 * @returns Challenge or null if not found
 * @throws Error if database query fails
 */
export async function loadChallengeByCode(code: string): Promise<Challenge | null> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('code', code)
    .single();

  if (error) {
    console.error('Error loading challenge by code:', error);
    throw new Error(`Failed to load challenge by code: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return rowToChallenge(data);
}
