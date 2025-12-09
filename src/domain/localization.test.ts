// src/domain/localization.test.ts
// Tests for team name localization

import { describe, it, expect } from 'vitest';
import { translateTeamName, formatMatchTeamsLocalized } from './localization';
import type { Match } from './types';

// Mock translation function for testing
function createMockT(translations: Record<string, string>) {
  return (key: string, options?: any) => {
    let result = translations[key];

    // If no translation found, check for defaultValue
    if (!result) {
      return options?.defaultValue !== undefined ? options.defaultValue : key;
    }

    // Handle interpolation for patterns
    if (options && typeof options === 'object') {
      Object.entries(options).forEach(([k, v]) => {
        if (k !== 'defaultValue' && typeof v === 'string' || typeof v === 'number') {
          result = result.replace(`{{${k}}}`, String(v));
        }
      });
    }

    return result;
  };
}

describe('translateTeamName', () => {
  it('translates country names directly', () => {
    const t = createMockT({
      'teamNames.Brazil': 'Brasil',
      'teamNames.Morocco': 'Marrocos',
      'teamNames.Germany': 'Alemanha',
    });

    expect(translateTeamName('Brazil', t as any)).toBe('Brasil');
    expect(translateTeamName('Morocco', t as any)).toBe('Marrocos');
    expect(translateTeamName('Germany', t as any)).toBe('Alemanha');
  });

  it('translates playoff placeholders', () => {
    const t = createMockT({
      'teamNames.UEFA playoff A winner': 'Vencedor do playoff A da UEFA',
      'teamNames.Inter-confederation playoff 1 winner': 'Vencedor do playoff interconfederação 1',
    });

    expect(translateTeamName('UEFA playoff A winner', t as any)).toBe('Vencedor do playoff A da UEFA');
    expect(translateTeamName('Inter-confederation playoff 1 winner', t as any))
      .toBe('Vencedor do playoff interconfederação 1');
  });

  it('translates "Winner of Match X" pattern', () => {
    const t = createMockT({
      'teamNames.patterns.winnerOfMatch': 'Vencedor da Partida {{matchNumber}}',
    });

    expect(translateTeamName('Winner of Match 73', t as any)).toBe('Vencedor da Partida 73');
    expect(translateTeamName('Winner of Match 101', t as any)).toBe('Vencedor da Partida 101');
  });

  it('translates "Loser of Match X" pattern', () => {
    const t = createMockT({
      'teamNames.patterns.loserOfMatch': 'Perdedor da Partida {{matchNumber}}',
    });

    expect(translateTeamName('Loser of Match 101', t as any)).toBe('Perdedor da Partida 101');
  });

  it('translates "Group X winner" pattern', () => {
    const t = createMockT({
      'teamNames.patterns.groupWinner': 'Vencedor do Grupo {{group}}',
    });

    expect(translateTeamName('Group A winner', t as any)).toBe('Vencedor do Grupo A');
    expect(translateTeamName('Group L winner', t as any)).toBe('Vencedor do Grupo L');
  });

  it('translates "Group X runner-up" pattern', () => {
    const t = createMockT({
      'teamNames.patterns.groupRunnerUp': 'Vice do Grupo {{group}}',
    });

    expect(translateTeamName('Group B runner-up', t as any)).toBe('Vice do Grupo B');
  });

  it('translates "Third place from Groups X/Y/Z" pattern', () => {
    const t = createMockT({
      'teamNames.patterns.thirdPlaceFromGroups': 'Terceiro colocado dos Grupos {{groups}}',
    });

    expect(translateTeamName('Third place from Groups C/E/F/H/I', t as any))
      .toBe('Terceiro colocado dos Grupos C/E/F/H/I');
  });

  it('returns original name if no translation found', () => {
    const t = createMockT({});

    expect(translateTeamName('Unknown Team', t as any)).toBe('Unknown Team');
  });
});

describe('formatMatchTeamsLocalized', () => {
  it('formats match teams with localized names', () => {
    const t = createMockT({
      'teamNames.Brazil': 'Brasil',
      'teamNames.Morocco': 'Marrocos',
    });

    const match: Match = {
      id: '123',
      matchNumber: 6,
      team1Name: 'Brazil',
      team2Name: 'Morocco',
      kickoffAt: new Date('2026-06-13T18:00:00-04:00'),
      scoreTeam1: null,
      scoreTeam2: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(formatMatchTeamsLocalized(match, t as any)).toBe('Brasil vs Marrocos');
  });

  it('formats match with placeholder teams', () => {
    const t = createMockT({
      'teamNames.patterns.winnerOfMatch': 'Vencedor da Partida {{matchNumber}}',
      'teamNames.patterns.groupWinner': 'Vencedor do Grupo {{group}}',
    });

    const match: Match = {
      id: '123',
      matchNumber: 89,
      team1Name: 'Winner of Match 74',
      team2Name: 'Group A winner',
      kickoffAt: new Date('2026-07-04T17:00:00-04:00'),
      scoreTeam1: null,
      scoreTeam2: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(formatMatchTeamsLocalized(match, t as any))
      .toBe('Vencedor da Partida 74 vs Vencedor do Grupo A');
  });
});
