// src/domain/types.ts
// Pure domain types (no React, no Supabase)

// ============================================================
// Enums (matching database enum types)
// ============================================================

export type MatchStatus = 'scheduled' | 'in_progress' | 'completed' | 'void';

export type ContractStatus = 'open' | 'locked' | 'settled' | 'void';

export type ContractType = 'winner' | 'goal_difference' | 'score';

export type BetStatus = 'open' | 'locked' | 'settled' | 'cancelled';

// ============================================================
// Core Domain Types
// ============================================================

/**
 * A World Cup match within a challenge.
 * Represents the real-world game with teams, scheduling, and final scores.
 */
export interface Match {
  id: string;
  challengeId: string;
  team1Name: string;
  team2Name: string;
  kickoffAt: Date | null;
  status: MatchStatus;
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
  blind: number; // Free Tackles added to pot
  status: ContractStatus;
  winningOutcome: string | null; // Set when settled (e.g., "Brazil", "2", "2-1")
  totalPot: number | null; // Snapshot at settlement
  removedFromGame: number | null; // Tackles removed (rounding or no winners)
  createdAt: Date;
  lockedAt: Date | null;
  settledAt: Date | null;
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
