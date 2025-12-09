// src/domain/contract.ts
// Pure domain logic for contracts (no React, no Supabase)

import type {
  Match,
  Contract,
  ContractType,
  Bet,
  ContractSettlementResult,
  ContractChallengeState,
} from './types';
import { getGoalDifference, formatMatchScore } from './match';

// ============================================================
// Outcome Calculation
// ============================================================

/**
 * Calculate the winning outcome for a Winner contract.
 * Returns the team name that won, or "Draw" if tied.
 *
 * @param match - The match with final scores
 * @returns Winning outcome string (team name or "Draw")
 * @throws Error if match doesn't have scores
 */
export function calculateWinnerOutcome(match: Match): string {
  if (match.scoreTeam1 === null || match.scoreTeam2 === null) {
    throw new Error('Match scores are not set');
  }

  if (match.scoreTeam1 > match.scoreTeam2) {
    return match.team1Name;
  } else if (match.scoreTeam2 > match.scoreTeam1) {
    return match.team2Name;
  } else {
    return 'Draw';
  }
}

/**
 * Calculate the winning outcome for a Goal Difference contract.
 * Returns the goal difference as a string (team1 - team2).
 *
 * @param match - The match with final scores
 * @returns Goal difference as string (e.g., "2", "0", "-1")
 * @throws Error if match doesn't have scores
 */
export function calculateGoalDifferenceOutcome(match: Match): string {
  const diff = getGoalDifference(match);
  if (diff === null) {
    throw new Error('Match scores are not set');
  }
  return diff.toString();
}

/**
 * Calculate the winning outcome for a Score contract.
 * Returns the exact score as a string.
 *
 * @param match - The match with final scores
 * @returns Score as string (e.g., "2-1")
 * @throws Error if match doesn't have scores
 */
export function calculateScoreOutcome(match: Match): string {
  if (match.scoreTeam1 === null || match.scoreTeam2 === null) {
    throw new Error('Match scores are not set');
  }
  return formatMatchScore(match);
}

/**
 * Calculate the winning outcome for any contract type.
 *
 * @param match - The match with final scores
 * @param contractType - The type of contract
 * @returns Winning outcome string
 * @throws Error if match doesn't have scores or contract type is invalid
 */
export function calculateContractOutcome(match: Match, contractType: ContractType): string {
  switch (contractType) {
    case 'winner':
      return calculateWinnerOutcome(match);
    case 'goal_difference':
      return calculateGoalDifferenceOutcome(match);
    case 'score':
      return calculateScoreOutcome(match);
    default:
      throw new Error(`Unknown contract type: ${contractType}`);
  }
}

// ============================================================
// Status Helpers
// ============================================================

/**
 * Check if a contract is settled.
 *
 * @param contract - The contract to check
 * @returns true if contract is settled
 */
export function isContractSettled(contract: Contract): boolean {
  return contract.settledAt !== null;
}

/**
 * Check if a contract is locked.
 *
 * @param state - Challenge-specific contract state
 * @returns true if contract is locked (lock timestamp set)
 */
export function isContractLocked(state: ContractChallengeState): boolean {
  return state.lockedAt !== null;
}

/**
 * Check if a contract can be settled.
 * A contract can be settled if it's locked (for this challenge) and not yet settled.
 *
 * @param contract - The contract to check
 * @param state - Challenge-specific contract state
 * @returns true if contract can be settled
 */
export function canSettleContract(
  contract: Contract,
  state: ContractChallengeState,
): boolean {
  return state.lockedAt !== null && contract.settledAt === null;
}

// ============================================================
// Payout Calculation
// ============================================================

/**
 * Calculate payouts for a contract based on bets and winning outcome.
 * Implements pari-mutuel betting: winners share the pot proportionally.
 * Payouts are rounded down to whole Tackles.
 *
 * @param contract - The contract being settled
 * @param bets - All bets on this contract
 * @param winningOutcome - The outcome that won
 * @returns Settlement result with payouts and removed Tackles
 */
export function calculateContractPayouts(
  contract: Contract,
  contractState: ContractChallengeState,
  bets: Bet[],
  winningOutcome: string,
): ContractSettlementResult {
  // Filter to only locked/settled bets (exclude cancelled/open)
  const validBets = bets.filter(bet => bet.status === 'locked' || bet.status === 'settled');

  // Calculate total pot: blind + sum of all valid stakes
  const totalStakes = validBets.reduce((sum, bet) => sum + bet.stake, 0);
  const totalPot = contractState.blind + totalStakes;

  // Find all bets on the winning outcome
  const winningBets = validBets.filter(bet => bet.outcome === winningOutcome);

  // If no one bet on the winning outcome, entire pot is removed
  if (winningBets.length === 0) {
    return {
      contractId: contract.id,
      winningOutcome,
      totalPot,
      payouts: new Map(),
      removedFromGame: totalPot,
    };
  }

  // Calculate total stakes on winning outcome
  const totalWinningStakes = winningBets.reduce((sum, bet) => sum + bet.stake, 0);

  // Calculate payouts proportionally and round down
  const payouts = new Map<string, number>();
  let totalPayoutSum = 0;

  for (const bet of winningBets) {
    // Payout = (stake / totalWinningStakes) * totalPot, rounded down
    const exactPayout = (bet.stake / totalWinningStakes) * totalPot;
    const roundedPayout = Math.floor(exactPayout);

    // Aggregate payouts by challenge entry (player may have multiple bets on same outcome)
    const currentPayout = payouts.get(bet.challengeEntryId) || 0;
    payouts.set(bet.challengeEntryId, currentPayout + roundedPayout);

    totalPayoutSum += roundedPayout;
  }

  // Removed from game = pot - sum of payouts (due to rounding)
  const removedFromGame = totalPot - totalPayoutSum;

  return {
    contractId: contract.id,
    winningOutcome,
    totalPot,
    payouts,
    removedFromGame,
  };
}

// ============================================================
// Display Helpers
// ============================================================

/**
 * Get a human-readable label for a contract type.
 *
 * @param type - The contract type
 * @returns Display label
 */
export function getContractTypeLabel(type: ContractType): string {
  switch (type) {
    case 'winner':
      return 'Winner';
    case 'goal_difference':
      return 'Goal Difference';
    case 'score':
      return 'Score';
    default:
      return type;
  }
}

/**
 * Format a contract outcome for display.
 * For goal difference, adds a "+" prefix for positive values.
 *
 * @param outcome - The outcome string
 * @param type - The contract type
 * @returns Formatted outcome
 */
export function formatContractOutcome(outcome: string, type: ContractType): string {
  if (type === 'goal_difference') {
    const diff = parseInt(outcome, 10);
    if (diff > 0) {
      return `+${diff}`;
    }
  }
  return outcome;
}
