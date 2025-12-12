// src/domain/contract.test.ts
import { describe, it, expect } from 'vitest';
import {
  calculateWinnerOutcome,
  calculateGoalDifferenceOutcome,
  calculateScoreOutcome,
  calculateContractOutcome,
  isContractSettled,
  isContractLocked,
  canSettleContract,
  calculateContractPayouts,
  getContractTypeLabel,
  formatContractOutcome,
} from './contract';
import type { Match, Contract, Bet, ContractChallengeState } from './types';

// Helper to create a test match
function createTestMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 'match-1',
    matchNumber: 1,
    team1Name: 'Brazil',
    team2Name: 'Morocco',
    kickoffAt: new Date('2026-06-13T18:00:00-04:00'),
    scoreTeam1: 2,
    scoreTeam2: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// Helper to create a test contract
function createTestContract(overrides: Partial<Contract> = {}): Contract {
  return {
    id: 'contract-1',
    matchId: 'match-1',
    type: 'winner',
    winningOutcome: null,
    createdAt: new Date(),
    settledAt: null,
    ...overrides,
  };
}

// Helper to create a test contract state
function createTestContractState(
  overrides: Partial<ContractChallengeState> = {},
): ContractChallengeState {
  return {
    contractId: 'contract-1',
    challengeId: 'challenge-1',
    blind: 30,
    totalPot: null,
    removedFromGame: null,
    lockedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// Helper to create a test bet
function createTestBet(overrides: Partial<Bet> = {}): Bet {
  return {
    id: 'bet-1',
    contractId: 'contract-1',
    challengeEntryId: 'entry-1',
    outcome: 'Brazil',
    stake: 10,
    status: 'locked',
    createdAt: new Date(),
    lockedAt: new Date(),
    settledAt: null,
    ...overrides,
  };
}

describe('contract domain logic', () => {
  describe('calculateWinnerOutcome', () => {
    it('should return team1 name when team1 wins', () => {
      const match = createTestMatch({ scoreTeam1: 2, scoreTeam2: 1 });

      expect(calculateWinnerOutcome(match)).toBe('Brazil');
    });

    it('should return team2 name when team2 wins', () => {
      const match = createTestMatch({ scoreTeam1: 1, scoreTeam2: 2 });

      expect(calculateWinnerOutcome(match)).toBe('Morocco');
    });

    it('should return "Draw" when scores are equal', () => {
      const match = createTestMatch({ scoreTeam1: 1, scoreTeam2: 1 });

      expect(calculateWinnerOutcome(match)).toBe('Draw');
    });

    it('should throw error when scores are not set', () => {
      const match = createTestMatch({ scoreTeam1: null, scoreTeam2: null });

      expect(() => calculateWinnerOutcome(match)).toThrow('Match scores are not set');
    });
  });

  describe('calculateGoalDifferenceOutcome', () => {
    it('should return positive difference as string', () => {
      const match = createTestMatch({ scoreTeam1: 3, scoreTeam2: 1 });

      expect(calculateGoalDifferenceOutcome(match)).toBe('2');
    });

    it('should return negative difference as string', () => {
      const match = createTestMatch({ scoreTeam1: 1, scoreTeam2: 3 });

      expect(calculateGoalDifferenceOutcome(match)).toBe('-2');
    });

    it('should return zero for draw', () => {
      const match = createTestMatch({ scoreTeam1: 2, scoreTeam2: 2 });

      expect(calculateGoalDifferenceOutcome(match)).toBe('0');
    });

    it('should throw error when scores are not set', () => {
      const match = createTestMatch({ scoreTeam1: null, scoreTeam2: null });

      expect(() => calculateGoalDifferenceOutcome(match)).toThrow('Match scores are not set');
    });
  });

  describe('calculateScoreOutcome', () => {
    it('should return formatted score', () => {
      const match = createTestMatch({ scoreTeam1: 2, scoreTeam2: 1 });

      expect(calculateScoreOutcome(match)).toBe('2-1');
    });

    it('should handle 0-0 score', () => {
      const match = createTestMatch({ scoreTeam1: 0, scoreTeam2: 0 });

      expect(calculateScoreOutcome(match)).toBe('0-0');
    });

    it('should throw error when scores are not set', () => {
      const match = createTestMatch({ scoreTeam1: null, scoreTeam2: null });

      expect(() => calculateScoreOutcome(match)).toThrow('Match scores are not set');
    });
  });

  describe('calculateContractOutcome', () => {
    it('should calculate winner outcome', () => {
      const match = createTestMatch({ scoreTeam1: 2, scoreTeam2: 1 });

      expect(calculateContractOutcome(match, 'winner')).toBe('Brazil');
    });

    it('should calculate goal_difference outcome', () => {
      const match = createTestMatch({ scoreTeam1: 3, scoreTeam2: 1 });

      expect(calculateContractOutcome(match, 'goal_difference')).toBe('2');
    });

    it('should calculate score outcome', () => {
      const match = createTestMatch({ scoreTeam1: 2, scoreTeam2: 1 });

      expect(calculateContractOutcome(match, 'score')).toBe('2-1');
    });
  });

  describe('contract status helpers', () => {
    it('isContractSettled should return true for settled contract', () => {
      const contract = createTestContract({ settledAt: new Date() });

      expect(isContractSettled(contract)).toBe(true);
    });

    it('isContractSettled should return false for locked contract', () => {
      const contract = createTestContract({ settledAt: null });

      expect(isContractSettled(contract)).toBe(false);
    });

    it('isContractLocked should return true for non-open contract', () => {
      const state = createTestContractState({ lockedAt: new Date() });

      expect(isContractLocked(state)).toBe(true);
    });

    it('isContractLocked should return false for open contract', () => {
      const state = createTestContractState({ lockedAt: null });

      expect(isContractLocked(state)).toBe(false);
    });

    it('canSettleContract should return true for locked contract', () => {
      const contract = createTestContract({ settledAt: null });
      const state = createTestContractState({ lockedAt: new Date() });

      expect(canSettleContract(contract, state)).toBe(true);
    });

    it('canSettleContract should return false for open contract', () => {
      const contract = createTestContract({ settledAt: null });
      const state = createTestContractState({ lockedAt: null });

      expect(canSettleContract(contract, state)).toBe(false);
    });

    it('canSettleContract should return false for already settled contract', () => {
      const contract = createTestContract({ settledAt: new Date() });
      const state = createTestContractState({ lockedAt: new Date() });

      expect(canSettleContract(contract, state)).toBe(false);
    });
  });

  describe('calculateContractPayouts', () => {
    it('should calculate payouts proportionally for winning bets', () => {
      // From AGENTS.md example: Brazil vs Morocco, Winner contract
      // Alice bets T$10 on Brazil, Bob T$20, Charlie T$15 = T$45 on Brazil
      // Blind: T$30
      // Total pot: T$90
      const contract = createTestContract();
      const state = createTestContractState({ blind: 30 });
      const bets: Bet[] = [
        createTestBet({ id: 'bet-1', challengeEntryId: 'alice', outcome: 'Brazil', stake: 10 }),
        createTestBet({ id: 'bet-2', challengeEntryId: 'bob', outcome: 'Brazil', stake: 20 }),
        createTestBet({ id: 'bet-3', challengeEntryId: 'charlie', outcome: 'Brazil', stake: 15 }),
        createTestBet({ id: 'bet-4', challengeEntryId: 'eve', outcome: 'Morocco', stake: 15 }),
      ];

      const result = calculateContractPayouts(contract, state, bets, 'Brazil');

      expect(result.totalPot).toBe(90); // 30 blind + 60 stakes
      expect(result.payouts.get('alice')).toBe(20); // 10/45 * 90 = 20
      expect(result.payouts.get('bob')).toBe(40); // 20/45 * 90 = 40
      expect(result.payouts.get('charlie')).toBe(30); // 15/45 * 90 = 30
      expect(result.payouts.get('eve')).toBeUndefined();
      expect(result.removedFromGame).toBe(0); // 90 - 90 = 0
    });

    it('should handle case where no one bet on winning outcome', () => {
      const contract = createTestContract();
      const state = createTestContractState({ blind: 30 });
      const bets: Bet[] = [
        createTestBet({ outcome: 'Brazil', stake: 10 }),
        createTestBet({ outcome: 'Morocco', stake: 15 }),
      ];

      const result = calculateContractPayouts(contract, state, bets, 'Draw');

      expect(result.totalPot).toBe(55); // 30 blind + 25 stakes
      expect(result.payouts.size).toBe(0);
      expect(result.removedFromGame).toBe(55); // entire pot removed
    });

    it('should round down payouts and track removed Tackles', () => {
      const contract = createTestContract();
      const state = createTestContractState({ blind: 30 });
      const bets: Bet[] = [
        createTestBet({ id: 'bet-1', challengeEntryId: 'alice', outcome: 'Brazil', stake: 10 }),
        createTestBet({ id: 'bet-2', challengeEntryId: 'bob', outcome: 'Brazil', stake: 10 }),
        createTestBet({ id: 'bet-3', challengeEntryId: 'charlie', outcome: 'Brazil', stake: 10 }),
      ];

      const result = calculateContractPayouts(contract, state, bets, 'Brazil');

      // Total pot: 30 + 30 = 60
      // Each player should get 60/3 = 20 exactly
      expect(result.totalPot).toBe(60);
      expect(result.payouts.get('alice')).toBe(20);
      expect(result.payouts.get('bob')).toBe(20);
      expect(result.payouts.get('charlie')).toBe(20);
      expect(result.removedFromGame).toBe(0);
    });

    it('should handle rounding with uneven division', () => {
      const contract = createTestContract();
      const state = createTestContractState({ blind: 1 });
      const bets: Bet[] = [
        createTestBet({ id: 'bet-1', challengeEntryId: 'alice', outcome: 'Brazil', stake: 1 }),
        createTestBet({ id: 'bet-2', challengeEntryId: 'bob', outcome: 'Brazil', stake: 1 }),
        createTestBet({ id: 'bet-3', challengeEntryId: 'charlie', outcome: 'Brazil', stake: 1 }),
      ];

      const result = calculateContractPayouts(contract, state, bets, 'Brazil');

      // Total pot: 1 + 3 = 4
      // Each should get 4/3 = 1.333... → floor = 1
      // Total payout: 3, removed: 1
      expect(result.totalPot).toBe(4);
      expect(result.payouts.get('alice')).toBe(1);
      expect(result.payouts.get('bob')).toBe(1);
      expect(result.payouts.get('charlie')).toBe(1);
      expect(result.removedFromGame).toBe(1); // rounding removed 1 Tackle
    });

    it('should aggregate multiple bets from same player', () => {
      const contract = createTestContract();
      const state = createTestContractState({ blind: 0 });
      const bets: Bet[] = [
        createTestBet({ id: 'bet-1', challengeEntryId: 'alice', outcome: 'Brazil', stake: 10 }),
        createTestBet({ id: 'bet-2', challengeEntryId: 'alice', outcome: 'Brazil', stake: 5 }),
      ];

      const result = calculateContractPayouts(contract, state, bets, 'Brazil');

      // Alice has 15 total stake, pot is 15, she should get all 15
      expect(result.totalPot).toBe(15);
      expect(result.payouts.get('alice')).toBe(15);
      expect(result.removedFromGame).toBe(0);
    });

    it('should only count locked/settled bets, not cancelled/open', () => {
      const contract = createTestContract();
      const state = createTestContractState({ blind: 10 });
      const bets: Bet[] = [
        createTestBet({ outcome: 'Brazil', stake: 10, status: 'locked' }),
        createTestBet({ outcome: 'Brazil', stake: 20, status: 'cancelled' }), // should be ignored
        createTestBet({ outcome: 'Brazil', stake: 30, status: 'open' }), // should be ignored
      ];

      const result = calculateContractPayouts(contract, state, bets, 'Brazil');

      // Only the locked bet counts: 10 blind + 10 stake = 20 total
      expect(result.totalPot).toBe(20);
      expect(result.removedFromGame).toBe(0);
    });
  });

  describe('display helpers', () => {
    it('getContractTypeLabel should return readable labels', () => {
      expect(getContractTypeLabel('winner')).toBe('Winner');
      expect(getContractTypeLabel('goal_difference')).toBe('Goal Difference');
      expect(getContractTypeLabel('score')).toBe('Score');
    });

    it('formatContractOutcome should add + for positive goal difference', () => {
      expect(formatContractOutcome('2', 'goal_difference')).toBe('+2');
      expect(formatContractOutcome('0', 'goal_difference')).toBe('0');
      expect(formatContractOutcome('-1', 'goal_difference')).toBe('-1');
    });

    it('formatContractOutcome should not modify other types', () => {
      expect(formatContractOutcome('Brazil', 'winner')).toBe('Brazil');
      expect(formatContractOutcome('2-1', 'score')).toBe('2-1');
    });
  });
});
