// src/domain/types.ts
// Pure domain types (no React, no Supabase)

// ============================================================
export type ContractType = 'winner' | 'goal_difference' | 'score';

export type BetStatus = 'open' | 'locked' | 'settled' | 'cancelled';

// ============================================================
// Core Domain Types
// ============================================================

/**
 * A self-contained game instance that an organizer creates.
 * Encapsulates configuration like language, lock time, and other rules.
 */
export interface Challenge {
  id: string;
  code: string;
  name: string;
  defaultLanguage: string;
  lockTimeHours: number; // Hours before kickoff when bets lock (e.g., 2.0)
  createdAt: Date;
}

/**
 * A World Cup match.
 * Represents the real-world game with teams, scheduling, and final scores.
 */
export interface Match {
  id: string;
  matchNumber: number; // Official match number (e.g., 1-104)
  team1Name: string;
  team2Name: string;
  kickoffAt: Date | null;
  scoreTeam1: number | null;
  scoreTeam2: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A betting market attached to a match.
 * Each match can have multiple contracts (Winner, Goal Difference, Score).
 */
export interface Contract {
  id: string;
  matchId: string;
  type: ContractType;
  winningOutcome: string | null; // Set when settled (e.g., "Brazil", "2", "2-1")
  createdAt: Date;
  settledAt: Date | null;
}

/**
 * Challenge-specific contract state (pot inputs and settlement totals).
 */
export interface ContractChallengeState {
  contractId: string;
  challengeId: string;
  blind: number; // Free Tackles added to pot
  totalPot: number | null; // Snapshot at settlement
  removedFromGame: number | null; // Tackles removed (rounding or no winners)
  lockedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A player's stake on a contract outcome.
 */
export interface Bet {
  id: string;
  contractId: string;
  challengeEntryId: string;
  outcome: string; // e.g., "Brazil", "Draw", "1", "2-1"
  stake: number; // Integer Tackles
  status: BetStatus;
  createdAt: Date;
  lockedAt: Date | null;
  settledAt: Date | null;
}

/**
 * Per-player payout for a settled contract (audit trail).
 */
export interface ContractPayout {
  id: number;
  contractId: string;
  challengeEntryId: string;
  payout: number; // Integer Tackles
  createdAt: Date;
}

/**
 * Result of settling a single contract.
 * Used by settlement logic to calculate and record payouts.
 */
export interface ContractSettlementResult {
  contractId: string;
  winningOutcome: string;
  totalPot: number;
  payouts: Map<string, number>; // challengeEntryId -> payout amount
  removedFromGame: number; // pot - sum(payouts)
}

// ============================================================
// View Models / Composite Types
// ============================================================

/**
 * Match with its associated contracts.
 * Useful for admin views and settlement flows.
 */
export interface MatchWithContracts {
  match: Match;
  contracts: Contract[];
}
