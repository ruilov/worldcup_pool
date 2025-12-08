// src/components/MatchList.tsx
// Simple match list component for displaying matches

import { useMatches } from '../hooks/useMatches';

interface MatchListProps {
  challengeId: string;
}

export function MatchList({ challengeId }: MatchListProps) {
  const { matches, loading, error } = useMatches(challengeId);

  if (loading) {
    return <div>Loading matches...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  if (matches.length === 0) {
    return <div>No matches found for this challenge.</div>;
  }

  return (
    <div>
      <h2>Matches</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ccc' }}>
            <th style={{ textAlign: 'left', padding: '8px' }}>Teams</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Kickoff</th>
            <th style={{ textAlign: 'center', padding: '8px' }}>Status</th>
            <th style={{ textAlign: 'center', padding: '8px' }}>Score</th>
            <th style={{ textAlign: 'center', padding: '8px' }}>Locked</th>
          </tr>
        </thead>
        <tbody>
          {matches.map((match) => (
            <tr
              key={match.id}
              style={{ borderBottom: '1px solid #eee' }}
            >
              <td style={{ padding: '8px' }}>{match.teamsDisplay}</td>
              <td style={{ padding: '8px', fontSize: '0.9em' }}>
                {match.kickoffDisplay}
              </td>
              <td style={{ textAlign: 'center', padding: '8px' }}>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.85em',
                    backgroundColor: getStatusColor(match.status),
                    color: 'white',
                  }}
                >
                  {match.status}
                </span>
              </td>
              <td
                style={{
                  textAlign: 'center',
                  padding: '8px',
                  fontWeight: 'bold',
                }}
              >
                {match.scoreDisplay}
              </td>
              <td style={{ textAlign: 'center', padding: '8px' }}>
                {match.isLocked ? '🔒' : '🔓'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Get a background color for a match status.
 */
function getStatusColor(status: string): string {
  switch (status) {
    case 'scheduled':
      return '#6c757d'; // gray
    case 'in_progress':
      return '#28a745'; // green
    case 'completed':
      return '#007bff'; // blue
    case 'void':
      return '#dc3545'; // red
    default:
      return '#6c757d';
  }
}
