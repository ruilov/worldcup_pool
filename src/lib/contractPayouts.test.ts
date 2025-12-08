import { describe, expect, it } from 'vitest'

import { calculateContractPayouts, type Bet } from './contractPayouts'

const brazilBets: Bet[] = [
  { playerId: 'Alice', outcome: 'Brazil', stake: 10 },
  { playerId: 'Bob', outcome: 'Brazil', stake: 20 },
  { playerId: 'Charlie', outcome: 'Brazil', stake: 15 },
  { playerId: 'Eve', outcome: 'Morocco', stake: 15 },
]

describe('calculateContractPayouts', () => {
  it('distributes the Brazil vs Morocco example when Brazil wins', () => {
    const result = calculateContractPayouts({
      blind: 30,
      bets: brazilBets,
      winningOutcome: 'Brazil',
    })

    expect(result.totalWagered).toBe(60)
    expect(result.totalPot).toBe(90)
    expect(result.payouts).toEqual({
      Alice: 20,
      Bob: 40,
      Charlie: 30,
      Eve: 0,
    })
    expect(result.removedFromGame).toBe(0)
  })

  it('distributes the Brazil vs Morocco example when Morocco wins', () => {
    const result = calculateContractPayouts({
      blind: 30,
      bets: brazilBets,
      winningOutcome: 'Morocco',
    })

    expect(result.payouts).toEqual({
      Alice: 0,
      Bob: 0,
      Charlie: 0,
      Eve: 90,
    })
    expect(result.removedFromGame).toBe(0)
  })

  it('removes the full pot when no one picked the winning outcome', () => {
    const result = calculateContractPayouts({
      blind: 30,
      bets: brazilBets,
      winningOutcome: 'Draw',
    })

    expect(result.totalPot).toBe(90)
    expect(result.payouts).toEqual({})
    expect(result.removedFromGame).toBe(90)
  })

  it('rounds down fractional payouts and removes leftovers', () => {
    const result = calculateContractPayouts({
      blind: 1,
      bets: [
        { playerId: 'P1', outcome: 'A', stake: 1 },
        { playerId: 'P2', outcome: 'A', stake: 2 },
      ],
      winningOutcome: 'A',
    })

    expect(result.totalPot).toBe(4)
    expect(result.payouts).toEqual({
      P1: 1,
      P2: 2,
    })
    expect(result.removedFromGame).toBe(1)
  })

  it('handles a contract with no winning bets', () => {
    const result = calculateContractPayouts({
      blind: 10,
      bets: [
        { playerId: 'P1', outcome: 'X', stake: 5 },
        { playerId: 'P2', outcome: 'X', stake: 3 },
      ],
      winningOutcome: 'Y',
    })

    expect(result.totalPot).toBe(18)
    expect(result.payouts).toEqual({})
    expect(result.removedFromGame).toBe(18)
  })

  it('sums multiple winning bets from the same player', () => {
    const result = calculateContractPayouts({
      blind: 0,
      bets: [
        { playerId: 'A', outcome: 'W', stake: 10 },
        { playerId: 'A', outcome: 'W', stake: 5 },
        { playerId: 'B', outcome: 'W', stake: 5 },
        { playerId: 'C', outcome: 'L', stake: 5 },
      ],
      winningOutcome: 'W',
    })

    expect(result.totalPot).toBe(25)
    expect(result.payouts).toEqual({
      A: 18,
      B: 6,
      C: 0,
    })
    expect(result.removedFromGame).toBe(1)
  })
})
