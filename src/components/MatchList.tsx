// src/components/MatchList.tsx
// Match list component with sports-stats terminal design

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMatches } from '../hooks/useMatches';
import { updateMatchScore } from '../persistence/matches';
import styles from './MatchList.module.css';

interface MatchListProps {
  challengeId: string;
}

export function MatchList({ challengeId }: MatchListProps) {
  const { t } = useTranslation();
  const { matches, loading, error, refetch } = useMatches(challengeId);
  const [scoreEdits, setScoreEdits] = useState<Record<string, { team1: string; team2: string }>>(
    {},
  );
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [inlineErrors, setInlineErrors] = useState<Record<string, string>>({});

  // Reset editable scores when matches change
  useEffect(() => {
    const next: Record<string, { team1: string; team2: string }> = {};
    matches.forEach((m) => {
      next[m.id] = {
        team1: m.match.scoreTeam1?.toString() ?? '',
        team2: m.match.scoreTeam2?.toString() ?? '',
      };
    });
    setScoreEdits(next);
    setInlineErrors({});
  }, [matches]);

  const handleSettle = async (matchId: string) => {
    const edit = scoreEdits[matchId] ?? { team1: '', team2: '' };
    const parseScore = (raw: string) => {
      const trimmed = raw.trim();
      if (trimmed === '') return null;
      const parsed = Number(trimmed);
      if (!Number.isInteger(parsed)) return Number.NaN;
      return parsed < 0 ? Number.NaN : parsed;
    };

    const parsedTeam1 = parseScore(edit.team1);
    const parsedTeam2 = parseScore(edit.team2);

    if (Number.isNaN(parsedTeam1) || Number.isNaN(parsedTeam2)) {
      setInlineErrors((prev) => ({
        ...prev,
        [matchId]: t('matches.invalidScore'),
      }));
      return;
    }

    setInlineErrors((prev) => {
      const next = { ...prev };
      delete next[matchId];
      return next;
    });

    setUpdating((prev) => ({ ...prev, [matchId]: true }));
    try {
      await updateMatchScore(matchId, parsedTeam1, parsedTeam2);
      await refetch();
    } catch (err) {
      setInlineErrors((prev) => ({
        ...prev,
        [matchId]:
          err instanceof Error ? err.message : t('matches.failedToUpdateScore'),
      }));
    } finally {
      setUpdating((prev) => {
        const next = { ...prev };
        delete next[matchId];
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>{t('matches.loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          {t('matches.errorPrefix')}: {error}
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>{t('matches.noMatches')}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.list}>
        {matches.map((match) => (
          <article key={match.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.meta}>
                <span className={styles.matchNumber}>{match.matchNumberDisplay}</span>
                <div className={styles.teams}>{match.teamsDisplay}</div>
              </div>
              <div className={styles.kickoffBlock}>
                <span className={styles.label}>{t('matches.tableHeaderKickoff')}</span>
                <span className={styles.kickoff}>{match.kickoffDisplay}</span>
              </div>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.scoreSection}>
                <div className={styles.sectionHeader}>
                  <span className={styles.label}>{t('matches.tableHeaderScore')}</span>
                  <span className={styles.scoreHint}>{t('matches.scoreInputPlaceholder')}</span>
                </div>
                <ScoreInputs
                  value={scoreEdits[match.id]}
                  placeholder={t('matches.scoreInputPlaceholder')}
                  ariaLabelTeam1={t('matches.scoreInputTeam1Aria', {
                    team: match.match.team1Name,
                  })}
                  ariaLabelTeam2={t('matches.scoreInputTeam2Aria', {
                    team: match.match.team2Name,
                  })}
                  onChange={(side, value) =>
                    setScoreEdits((prev) => ({
                      ...prev,
                      [match.id]: {
                        ...(prev[match.id] ?? { team1: '', team2: '' }),
                        [side]: value,
                      },
                    }))
                  }
                />
                {inlineErrors[match.id] ? (
                  <div className={styles.inlineError}>{inlineErrors[match.id]}</div>
                ) : null}
              </div>

              <div className={styles.actions}>
                <button
                  className={styles.primaryAction}
                  type="button"
                  onClick={() => handleSettle(match.id)}
                  disabled={updating[match.id]}
                >
                  {updating[match.id] ? t('matches.updatingScore') : t('matches.settleContracts')}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

type ScoreInputsProps = {
  value?: { team1: string; team2: string };
  placeholder: string;
  ariaLabelTeam1: string;
  ariaLabelTeam2: string;
  onChange: (side: 'team1' | 'team2', value: string) => void;
};

function ScoreInputs({
  value,
  placeholder,
  ariaLabelTeam1,
  ariaLabelTeam2,
  onChange,
}: ScoreInputsProps) {
  const team1 = value?.team1 ?? '';
  const team2 = value?.team2 ?? '';

  return (
    <div className={styles.scoreInputs}>
      <input
        className={styles.scoreInput}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label={ariaLabelTeam1}
        placeholder={placeholder}
        value={team1}
        onChange={(e) => onChange('team1', e.target.value)}
      />
      <span className={styles.scoreSeparator}>-</span>
      <input
        className={styles.scoreInput}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label={ariaLabelTeam2}
        placeholder={placeholder}
        value={team2}
        onChange={(e) => onChange('team2', e.target.value)}
      />
    </div>
  );
}
