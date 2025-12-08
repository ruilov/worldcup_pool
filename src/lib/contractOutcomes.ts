export type SimpleScore = {
  team1Goals: number
  team2Goals: number
}

/**
 * Returns the outcome string for a Winner contract given a score and team labels.
 * - If team1Goals > team2Goals, returns team1Label.
 * - If team2Goals > team1Goals, returns team2Label.
 * - If equal, returns "Draw".
 */
export function getWinnerOutcome(
  score: SimpleScore,
  team1Label: string,
  team2Label: string,
): string {
  if (score.team1Goals > score.team2Goals) {
    return team1Label
  }
  if (score.team2Goals > score.team1Goals) {
    return team2Label
  }
  return 'Draw'
}

/**
 * Returns the goal difference outcome string for a Goal Difference contract.
 * The outcome is (team1Goals - team2Goals) converted to a string.
 */
export function getGoalDifferenceOutcome(score: SimpleScore): string {
  const diff = score.team1Goals - score.team2Goals
  return String(diff)
}

/**
 * Returns the score outcome string for a Score contract.
 * Format: "<team1Goals>-<team2Goals>".
 */
export function getScoreOutcome(score: SimpleScore): string {
  return `${score.team1Goals}-${score.team2Goals}`
}

export type ContractOutcomes = {
  winnerOutcome: string
  goalDifferenceOutcome: string
  scoreOutcome: string
}

/**
 * Convenience function that returns all three contract outcomes for a single score.
 */
export function getAllContractOutcomes(
  score: SimpleScore,
  team1Label: string,
  team2Label: string,
): ContractOutcomes {
  return {
    winnerOutcome: getWinnerOutcome(score, team1Label, team2Label),
    goalDifferenceOutcome: getGoalDifferenceOutcome(score),
    scoreOutcome: getScoreOutcome(score),
  }
}
