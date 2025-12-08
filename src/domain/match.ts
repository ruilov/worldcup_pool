// src/domain/match.ts
// Pure domain logic for matches (no React, no Supabase)

import type { Match, MatchStatus } from './types';

// ============================================================
// Constants
// ============================================================

/**
 * Number of milliseconds before kickoff when bets lock.
 * Default: 2 hours = 7,200,000 milliseconds
 */
export const LOCK_TIME_BEFORE_KICKOFF_MS = 2 * 60 * 60 * 1000;

// ============================================================
// Time and Locking Logic
// ============================================================

/**
 * Calculate the lock time for a match.
 * Returns null if the match has no kickoff time.
 *
 * @param match - The match to calculate lock time for
 * @returns Lock time (2 hours before kickoff) or null
 */
export function getMatchLockTime(match: Match): Date | null {
  if (!match.kickoffAt) {
    return null;
  }
  return new Date(match.kickoffAt.getTime() - LOCK_TIME_BEFORE_KICKOFF_MS);
}

/**
 * Determine if a match is currently locked (past the lock time).
 * A match is locked if current time >= lock time.
 *
 * @param match - The match to check
 * @param now - Current time (defaults to Date.now())
 * @returns true if the match is locked, false otherwise
 */
export function isMatchLocked(match: Match, now: Date = new Date()): boolean {
  const lockTime = getMatchLockTime(match);
  if (!lockTime) {
    // No kickoff time means we can't determine lock status; treat as not locked
    return false;
  }
  return now >= lockTime;
}

/**
 * Determine if a match can accept new bets.
 * Bets can be placed if the match is not locked and status is 'scheduled'.
 *
 * @param match - The match to check
 * @param now - Current time (defaults to Date.now())
 * @returns true if bets can be placed, false otherwise
 */
export function canPlaceBetsOnMatch(match: Match, now: Date = new Date()): boolean {
  return match.status === 'scheduled' && !isMatchLocked(match, now);
}

// ============================================================
// Score Formatting
// ============================================================

/**
 * Format a match score for display.
 * Returns "?" if scores are not yet available.
 *
 * @param match - The match with scores
 * @returns Formatted score string (e.g., "2-1" or "?")
 */
export function formatMatchScore(match: Match): string {
  if (match.scoreTeam1 === null || match.scoreTeam2 === null) {
    return '?';
  }
  return `${match.scoreTeam1}-${match.scoreTeam2}`;
}

/**
 * Format the goal difference for a match.
 * Returns null if scores are not yet available.
 *
 * @param match - The match with scores
 * @returns Goal difference (team1 - team2) or null
 */
export function getGoalDifference(match: Match): number | null {
  if (match.scoreTeam1 === null || match.scoreTeam2 === null) {
    return null;
  }
  return match.scoreTeam1 - match.scoreTeam2;
}

/**
 * Format goal difference as a string with sign.
 * Returns null if scores are not yet available.
 *
 * @param match - The match with scores
 * @returns Formatted goal difference (e.g., "+2", "0", "-1") or null
 */
export function formatGoalDifference(match: Match): string | null {
  const diff = getGoalDifference(match);
  if (diff === null) {
    return null;
  }
  if (diff > 0) {
    return `+${diff}`;
  }
  return diff.toString();
}

// ============================================================
// Status Helpers
// ============================================================

/**
 * Check if a match has a final score recorded.
 *
 * @param match - The match to check
 * @returns true if both scores are set
 */
export function hasScore(match: Match): boolean {
  return match.scoreTeam1 !== null && match.scoreTeam2 !== null;
}

/**
 * Check if a match is in a final state (completed or void).
 *
 * @param match - The match to check
 * @returns true if match is completed or void
 */
export function isMatchFinal(match: Match): boolean {
  return match.status === 'completed' || match.status === 'void';
}

/**
 * Check if a match can be settled.
 * A match can be settled if it's completed and has a score.
 *
 * @param match - The match to check
 * @returns true if match can be settled
 */
export function canSettleMatch(match: Match): boolean {
  return match.status === 'completed' && hasScore(match);
}

// ============================================================
// Display Helpers
// ============================================================

/**
 * Get a human-readable status label for a match.
 *
 * @param match - The match
 * @returns Status label
 */
export function getMatchStatusLabel(match: Match): MatchStatus {
  return match.status;
}

/**
 * Format match teams for display.
 *
 * @param match - The match
 * @returns Formatted team names (e.g., "Brazil vs Morocco")
 */
export function formatMatchTeams(match: Match): string {
  return `${match.team1Name} vs ${match.team2Name}`;
}
