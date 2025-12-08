import { describe, expect, it } from 'vitest'

import {
  getAllContractOutcomes,
  getGoalDifferenceOutcome,
  getScoreOutcome,
  getWinnerOutcome,
  type SimpleScore,
} from './contractOutcomes'

describe('contract outcomes helpers', () => {
  it('handles team1 win (Brazil vs Morocco 2-1)', () => {
    const score: SimpleScore = { team1Goals: 2, team2Goals: 1 }
    expect(getWinnerOutcome(score, 'Brazil', 'Morocco')).toBe('Brazil')
    expect(getGoalDifferenceOutcome(score)).toBe('1')
    expect(getScoreOutcome(score)).toBe('2-1')

    const all = getAllContractOutcomes(score, 'Brazil', 'Morocco')
    expect(all.winnerOutcome).toBe(getWinnerOutcome(score, 'Brazil', 'Morocco'))
    expect(all.goalDifferenceOutcome).toBe(getGoalDifferenceOutcome(score))
    expect(all.scoreOutcome).toBe(getScoreOutcome(score))
  })

  it('handles team2 win (Spain vs Germany 0-3)', () => {
    const score: SimpleScore = { team1Goals: 0, team2Goals: 3 }
    expect(getWinnerOutcome(score, 'Spain', 'Germany')).toBe('Germany')
    expect(getGoalDifferenceOutcome(score)).toBe('-3')
    expect(getScoreOutcome(score)).toBe('0-3')
  })

  it('handles draw (Argentina vs France 1-1)', () => {
    const score: SimpleScore = { team1Goals: 1, team2Goals: 1 }
    expect(getWinnerOutcome(score, 'Argentina', 'France')).toBe('Draw')
    expect(getGoalDifferenceOutcome(score)).toBe('0')
    expect(getScoreOutcome(score)).toBe('1-1')
  })

  it('handles zero goals draw (0-0)', () => {
    const score: SimpleScore = { team1Goals: 0, team2Goals: 0 }
    expect(getWinnerOutcome(score, 'Team1', 'Team2')).toBe('Draw')
    expect(getGoalDifferenceOutcome(score)).toBe('0')
    expect(getScoreOutcome(score)).toBe('0-0')
  })
})
