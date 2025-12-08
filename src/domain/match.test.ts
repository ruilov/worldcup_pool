// src/domain/match.test.ts
import { describe, it, expect } from 'vitest';
import {
  getMatchLockTime,
  isMatchLocked,
  canPlaceBetsOnMatch,
  formatMatchScore,
  getGoalDifference,
  formatGoalDifference,
  hasScore,
  isMatchFinal,
  canSettleMatch,
  formatMatchTeams,
} from './match';
import type { Match } from './types';

// Test lock time: 2 hours
const TEST_LOCK_TIME_HOURS = 2.0;
const TEST_LOCK_TIME_MS = TEST_LOCK_TIME_HOURS * 60 * 60 * 1000;

// Helper to create a test match
function createTestMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 'match-1',
    challengeId: 'challenge-1',
    team1Name: 'Brazil',
    team2Name: 'Morocco',
    kickoffAt: new Date('2026-06-13T18:00:00-04:00'),
    status: 'scheduled',
    scoreTeam1: null,
    scoreTeam2: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('match domain logic', () => {
  describe('getMatchLockTime', () => {
    it('should return lock time 2 hours before kickoff', () => {
      const kickoff = new Date('2026-06-13T18:00:00-04:00');
      const match = createTestMatch({ kickoffAt: kickoff });
      const lockTime = getMatchLockTime(match, TEST_LOCK_TIME_HOURS);

      expect(lockTime).not.toBeNull();
      expect(lockTime!.getTime()).toBe(kickoff.getTime() - TEST_LOCK_TIME_MS);
    });

    it('should return null if match has no kickoff time', () => {
      const match = createTestMatch({ kickoffAt: null });
      const lockTime = getMatchLockTime(match, TEST_LOCK_TIME_HOURS);

      expect(lockTime).toBeNull();
    });

    it('should support custom lock times', () => {
      const kickoff = new Date('2026-06-13T18:00:00-04:00');
      const match = createTestMatch({ kickoffAt: kickoff });
      const lockTime = getMatchLockTime(match, 1.5); // 90 minutes

      expect(lockTime).not.toBeNull();
      expect(lockTime!.getTime()).toBe(kickoff.getTime() - 1.5 * 60 * 60 * 1000);
    });
  });

  describe('isMatchLocked', () => {
    it('should return false before lock time', () => {
      const kickoff = new Date('2026-06-13T18:00:00-04:00');
      const match = createTestMatch({ kickoffAt: kickoff });
      const now = new Date(kickoff.getTime() - TEST_LOCK_TIME_MS - 1000); // 1 second before lock

      expect(isMatchLocked(match, TEST_LOCK_TIME_HOURS, now)).toBe(false);
    });

    it('should return true at exactly lock time', () => {
      const kickoff = new Date('2026-06-13T18:00:00-04:00');
      const match = createTestMatch({ kickoffAt: kickoff });
      const now = new Date(kickoff.getTime() - TEST_LOCK_TIME_MS);

      expect(isMatchLocked(match, TEST_LOCK_TIME_HOURS, now)).toBe(true);
    });

    it('should return true after lock time', () => {
      const kickoff = new Date('2026-06-13T18:00:00-04:00');
      const match = createTestMatch({ kickoffAt: kickoff });
      const now = new Date(kickoff.getTime() - TEST_LOCK_TIME_MS + 1000); // 1 second after lock

      expect(isMatchLocked(match, TEST_LOCK_TIME_HOURS, now)).toBe(true);
    });

    it('should return false if match has no kickoff time', () => {
      const match = createTestMatch({ kickoffAt: null });

      expect(isMatchLocked(match, TEST_LOCK_TIME_HOURS)).toBe(false);
    });
  });

  describe('canPlaceBetsOnMatch', () => {
    it('should return true for scheduled match before lock time', () => {
      const kickoff = new Date('2026-06-13T18:00:00-04:00');
      const match = createTestMatch({ kickoffAt: kickoff, status: 'scheduled' });
      const now = new Date(kickoff.getTime() - TEST_LOCK_TIME_MS - 1000);

      expect(canPlaceBetsOnMatch(match, TEST_LOCK_TIME_HOURS, now)).toBe(true);
    });

    it('should return false for scheduled match after lock time', () => {
      const kickoff = new Date('2026-06-13T18:00:00-04:00');
      const match = createTestMatch({ kickoffAt: kickoff, status: 'scheduled' });
      const now = new Date(kickoff.getTime() - TEST_LOCK_TIME_MS + 1000);

      expect(canPlaceBetsOnMatch(match, TEST_LOCK_TIME_HOURS, now)).toBe(false);
    });

    it('should return false for in_progress match', () => {
      const match = createTestMatch({ status: 'in_progress' });

      expect(canPlaceBetsOnMatch(match, TEST_LOCK_TIME_HOURS)).toBe(false);
    });

    it('should return false for completed match', () => {
      const match = createTestMatch({ status: 'completed' });

      expect(canPlaceBetsOnMatch(match, TEST_LOCK_TIME_HOURS)).toBe(false);
    });

    it('should return false for void match', () => {
      const match = createTestMatch({ status: 'void' });

      expect(canPlaceBetsOnMatch(match, TEST_LOCK_TIME_HOURS)).toBe(false);
    });
  });

  describe('formatMatchScore', () => {
    it('should format score when both scores are set', () => {
      const match = createTestMatch({ scoreTeam1: 2, scoreTeam2: 1 });

      expect(formatMatchScore(match)).toBe('2-1');
    });

    it('should return "?" when scores are null', () => {
      const match = createTestMatch({ scoreTeam1: null, scoreTeam2: null });

      expect(formatMatchScore(match)).toBe('?');
    });

    it('should return "?" when only team1 score is set', () => {
      const match = createTestMatch({ scoreTeam1: 2, scoreTeam2: null });

      expect(formatMatchScore(match)).toBe('?');
    });

    it('should handle 0-0 score', () => {
      const match = createTestMatch({ scoreTeam1: 0, scoreTeam2: 0 });

      expect(formatMatchScore(match)).toBe('0-0');
    });
  });

  describe('getGoalDifference', () => {
    it('should calculate positive goal difference', () => {
      const match = createTestMatch({ scoreTeam1: 3, scoreTeam2: 1 });

      expect(getGoalDifference(match)).toBe(2);
    });

    it('should calculate negative goal difference', () => {
      const match = createTestMatch({ scoreTeam1: 1, scoreTeam2: 3 });

      expect(getGoalDifference(match)).toBe(-2);
    });

    it('should calculate zero goal difference', () => {
      const match = createTestMatch({ scoreTeam1: 2, scoreTeam2: 2 });

      expect(getGoalDifference(match)).toBe(0);
    });

    it('should return null when scores are not set', () => {
      const match = createTestMatch({ scoreTeam1: null, scoreTeam2: null });

      expect(getGoalDifference(match)).toBeNull();
    });
  });

  describe('formatGoalDifference', () => {
    it('should format positive difference with + sign', () => {
      const match = createTestMatch({ scoreTeam1: 3, scoreTeam2: 1 });

      expect(formatGoalDifference(match)).toBe('+2');
    });

    it('should format negative difference without + sign', () => {
      const match = createTestMatch({ scoreTeam1: 1, scoreTeam2: 3 });

      expect(formatGoalDifference(match)).toBe('-2');
    });

    it('should format zero difference', () => {
      const match = createTestMatch({ scoreTeam1: 2, scoreTeam2: 2 });

      expect(formatGoalDifference(match)).toBe('0');
    });

    it('should return null when scores are not set', () => {
      const match = createTestMatch({ scoreTeam1: null, scoreTeam2: null });

      expect(formatGoalDifference(match)).toBeNull();
    });
  });

  describe('hasScore', () => {
    it('should return true when both scores are set', () => {
      const match = createTestMatch({ scoreTeam1: 2, scoreTeam2: 1 });

      expect(hasScore(match)).toBe(true);
    });

    it('should return false when scores are null', () => {
      const match = createTestMatch({ scoreTeam1: null, scoreTeam2: null });

      expect(hasScore(match)).toBe(false);
    });

    it('should return false when only one score is set', () => {
      const match = createTestMatch({ scoreTeam1: 2, scoreTeam2: null });

      expect(hasScore(match)).toBe(false);
    });

    it('should return true for 0-0 score', () => {
      const match = createTestMatch({ scoreTeam1: 0, scoreTeam2: 0 });

      expect(hasScore(match)).toBe(true);
    });
  });

  describe('isMatchFinal', () => {
    it('should return true for completed match', () => {
      const match = createTestMatch({ status: 'completed' });

      expect(isMatchFinal(match)).toBe(true);
    });

    it('should return true for void match', () => {
      const match = createTestMatch({ status: 'void' });

      expect(isMatchFinal(match)).toBe(true);
    });

    it('should return false for scheduled match', () => {
      const match = createTestMatch({ status: 'scheduled' });

      expect(isMatchFinal(match)).toBe(false);
    });

    it('should return false for in_progress match', () => {
      const match = createTestMatch({ status: 'in_progress' });

      expect(isMatchFinal(match)).toBe(false);
    });
  });

  describe('canSettleMatch', () => {
    it('should return true for completed match with score', () => {
      const match = createTestMatch({
        status: 'completed',
        scoreTeam1: 2,
        scoreTeam2: 1,
      });

      expect(canSettleMatch(match)).toBe(true);
    });

    it('should return false for completed match without score', () => {
      const match = createTestMatch({
        status: 'completed',
        scoreTeam1: null,
        scoreTeam2: null,
      });

      expect(canSettleMatch(match)).toBe(false);
    });

    it('should return false for scheduled match with score', () => {
      const match = createTestMatch({
        status: 'scheduled',
        scoreTeam1: 2,
        scoreTeam2: 1,
      });

      expect(canSettleMatch(match)).toBe(false);
    });

    it('should return false for in_progress match', () => {
      const match = createTestMatch({ status: 'in_progress' });

      expect(canSettleMatch(match)).toBe(false);
    });
  });

  describe('formatMatchTeams', () => {
    it('should format team names with vs', () => {
      const match = createTestMatch({
        team1Name: 'Brazil',
        team2Name: 'Morocco',
      });

      expect(formatMatchTeams(match)).toBe('Brazil vs Morocco');
    });
  });
});
