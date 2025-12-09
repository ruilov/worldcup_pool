// src/components/MatchList.tsx
// Match list component with sports-stats terminal design

import { useTranslation } from 'react-i18next';
import { useMatches } from '../hooks/useMatches';
import styles from './MatchList.module.css';

interface MatchListProps {
  challengeId: string;
}

export function MatchList({ challengeId }: MatchListProps) {
  const { t } = useTranslation();
  const { matches, loading, error } = useMatches(challengeId);

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
      <div className={styles.header}>
        <h2 className={styles.heading}>{t('matches.heading')}</h2>
      </div>

      <div className={styles.grid}>
        {/* Grid header */}
        <div className={styles.gridHeader}>
          <div className={styles.gridHeaderCell}>{t('matches.tableHeaderMatch')}</div>
          <div className={styles.gridHeaderCell}>{t('matches.tableHeaderTeams')}</div>
          <div className={styles.gridHeaderCell}>{t('matches.tableHeaderKickoff')}</div>
          <div className={styles.gridHeaderCell}>{t('matches.tableHeaderStatus')}</div>
          <div className={styles.gridHeaderCell}>{t('matches.tableHeaderScore')}</div>
        </div>

        {/* Match rows */}
        {matches.map((match) => (
          <div key={match.id} className={styles.matchRow}>
            <div className={`${styles.cell} ${styles.cellMatch}`}>
              {match.matchNumberDisplay}
            </div>
            <div className={`${styles.cell} ${styles.cellTeams}`}>
              {match.teamsDisplay}
            </div>
            <div className={`${styles.cell} ${styles.cellKickoff}`}>
              {match.kickoffDisplay}
            </div>
            <div className={`${styles.cell} ${styles.cellStatus}`}>
              <StatusBadge status={match.status} t={t} />
            </div>
            <div className={`${styles.cell} ${styles.cellScore}`}>
              <ScoreDisplay score={match.scoreDisplay} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Status badge component
 */
function StatusBadge({ status, t }: { status: string; t: (key: string) => string }) {
  const statusClass = getStatusClassName(status);
  const label = getLocalizedStatus(status, t);

  return <span className={`${styles.statusBadge} ${statusClass}`}>{label}</span>;
}

/**
 * Score display component
 */
function ScoreDisplay({ score }: { score: string }) {
  const isPlaceholder = score === '?' || score === '-';

  return (
    <span className={isPlaceholder ? styles.scorePlaceholder : styles.score}>
      {score}
    </span>
  );
}

/**
 * Get CSS class name for status badge
 */
function getStatusClassName(status: string): string {
  switch (status) {
    case 'scheduled':
      return styles.scheduled;
    case 'in_progress':
      return styles.inProgress;
    case 'completed':
      return styles.completed;
    case 'void':
      return styles.void;
    default:
      return '';
  }
}

/**
 * Get localized status label
 */
function getLocalizedStatus(status: string, t: (key: string) => string): string {
  switch (status) {
    case 'scheduled':
      return t('matches.statusScheduled');
    case 'in_progress':
      return t('matches.statusInProgress');
    case 'completed':
      return t('matches.statusCompleted');
    case 'void':
      return t('matches.statusVoid');
    default:
      return status;
  }
}
