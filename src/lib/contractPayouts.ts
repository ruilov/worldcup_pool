export type PlayerId = string

export type Bet = {
  playerId: PlayerId
  outcome: string
  stake: number
}

export type ContractPayoutInput = {
  blind: number
  bets: Bet[]
  winningOutcome: string
}

export type PayoutsByPlayer = Record<PlayerId, number>

export type ContractPayoutResult = {
  totalWagered: number
  totalPot: number
  payouts: PayoutsByPlayer
  removedFromGame: number
}

export function calculateContractPayouts(
  input: ContractPayoutInput,
): ContractPayoutResult {
  const { blind, bets, winningOutcome } = input

  const totalWagered = bets.reduce((sum, bet) => sum + bet.stake, 0)
  const totalPot = totalWagered + blind

  const winningBets = bets.filter((bet) => bet.outcome === winningOutcome)
  const winnerStakeTotal = winningBets.reduce((sum, bet) => sum + bet.stake, 0)

  if (winnerStakeTotal <= 0) {
    return {
      totalWagered,
      totalPot,
      payouts: {},
      removedFromGame: totalPot,
    }
  }

  const playerIds = Array.from(new Set(bets.map((bet) => bet.playerId)))
  const payouts: Record<PlayerId, number> = {}
  playerIds.forEach((id) => {
    payouts[id] = 0
  })

  winningBets.forEach((bet) => {
    const share = (bet.stake / winnerStakeTotal) * totalPot
    payouts[bet.playerId] += share
  })

  let sumPaidOut = 0
  Object.entries(payouts).forEach(([playerId, amount]) => {
    const rounded = Math.floor(amount)
    payouts[playerId] = rounded
    sumPaidOut += rounded
  })

  const removedFromGame = totalPot - sumPaidOut

  return {
    totalWagered,
    totalPot,
    payouts,
    removedFromGame,
  }
}
