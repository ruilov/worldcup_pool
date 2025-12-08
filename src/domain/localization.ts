import type { TFunction } from 'i18next';
import type { Match } from './types';

/**
 * Translates a team name using i18n.
 *
 * Handles both:
 * - Direct country names (e.g., "Brazil" -> "Brasil" in Portuguese)
 * - Dynamic placeholders with patterns (e.g., "Winner of Match 73" -> "Vencedor da Partida 73")
 *
 * @param teamName - The team name from the database (in English)
 * @param t - The i18next translation function
 * @returns The localized team name
 */
export function translateTeamName(teamName: string, t: TFunction): string {
  // First, try direct translation lookup
  const directTranslation = t(`teamNames.${teamName}`, { defaultValue: null });
  if (directTranslation) {
    return directTranslation;
  }

  // Handle "Winner of Match X" pattern
  const winnerMatch = teamName.match(/^Winner of Match (\d+)$/);
  if (winnerMatch) {
    const matchNum = winnerMatch[1];
    return t('teamNames.patterns.winnerOfMatch', { matchNumber: matchNum });
  }

  // Handle "Loser of Match X" pattern
  const loserMatch = teamName.match(/^Loser of Match (\d+)$/);
  if (loserMatch) {
    const matchNum = loserMatch[1];
    return t('teamNames.patterns.loserOfMatch', { matchNumber: matchNum });
  }

  // Handle "Group X winner" pattern
  const groupWinnerMatch = teamName.match(/^Group ([A-L]) winner$/);
  if (groupWinnerMatch) {
    const group = groupWinnerMatch[1];
    return t('teamNames.patterns.groupWinner', { group });
  }

  // Handle "Group X runner-up" pattern
  const groupRunnerUpMatch = teamName.match(/^Group ([A-L]) runner-up$/);
  if (groupRunnerUpMatch) {
    const group = groupRunnerUpMatch[1];
    return t('teamNames.patterns.groupRunnerUp', { group });
  }

  // Handle "Third place from Groups X/Y/Z/..." pattern
  const thirdPlaceMatch = teamName.match(/^Third place from Groups (.+)$/);
  if (thirdPlaceMatch) {
    const groups = thirdPlaceMatch[1];
    return t('teamNames.patterns.thirdPlaceFromGroups', { groups });
  }

  // If no translation found, return the original name
  return teamName;
}

/**
 * Formats match teams with localized team names.
 *
 * @param match - The match to format
 * @param t - The i18next translation function
 * @returns Formatted string like "Brasil vs Marrocos" (localized)
 */
export function formatMatchTeamsLocalized(match: Match, t: TFunction): string {
  const team1 = translateTeamName(match.team1Name, t);
  const team2 = translateTeamName(match.team2Name, t);
  return `${team1} vs ${team2}`;
}
