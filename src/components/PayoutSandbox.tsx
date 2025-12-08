import { Fragment, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  calculateContractPayouts,
  type Bet,
  type ContractPayoutResult,
} from '../lib/contractPayouts'

type BetRow = Bet & { id: string }

const initialBets: BetRow[] = [
  { id: 'alice', playerId: 'Alice', outcome: 'Brazil', stake: 10 },
  { id: 'bob', playerId: 'Bob', outcome: 'Brazil', stake: 20 },
  { id: 'charlie', playerId: 'Charlie', outcome: 'Brazil', stake: 15 },
  { id: 'eve', playerId: 'Eve', outcome: 'Morocco', stake: 15 },
]

export function PayoutSandbox() {
  const { t } = useTranslation()
  const [blind, setBlind] = useState<number>(30)
  const [winningOutcome, setWinningOutcome] = useState<string>('Brazil')
  const [bets, setBets] = useState<BetRow[]>(initialBets)
  const [result, setResult] = useState<ContractPayoutResult | null>(null)
  const [idCounter, setIdCounter] = useState<number>(0)

  const handleBetChange = (id: string, field: keyof Bet, value: string) => {
    setBets(current =>
      current.map(bet =>
        bet.id === id
          ? {
              ...bet,
              [field]:
                field === 'stake'
                  ? Number.isNaN(Number(value))
                    ? 0
                    : Number(value)
                  : value,
            }
          : bet,
      ),
    )
  }

  const handleAddBet = () => {
    const newId = `new-${Date.now()}-${idCounter}`
    setIdCounter(prev => prev + 1)
    setBets(current => [
      ...current,
      { id: newId, playerId: '', outcome: '', stake: 1 },
    ])
  }

  const handleRemoveBet = (id: string) => {
    setBets(current => current.filter(bet => bet.id !== id))
  }

  const handleCalculate = () => {
    const inputBets: Bet[] = bets
      .filter(bet => bet.stake > 0)
      .map(({ id: _id, ...rest }) => rest)
    const input = {
      blind: Math.max(0, Math.floor(blind)),
      bets: inputBets,
      winningOutcome,
    }
    const payoutResult = calculateContractPayouts(input)
    setResult(payoutResult)
  }

  const playerIds = useMemo(() => {
    const ids = new Set<string>()
    bets.forEach(bet => {
      if (bet.playerId) {
        ids.add(bet.playerId)
      }
    })
    if (result) {
      Object.keys(result.payouts).forEach(id => ids.add(id))
    }
    return Array.from(ids)
  }, [bets, result])

  return (
    <div
      style={{
        padding: '1rem',
        border: '1px solid #ddd',
        borderRadius: '8px',
        background: '#f9fafb',
      }}
    >
      <h1 style={{ marginBottom: '0.25rem' }}>{t('sandbox.heading')}</h1>
      <p style={{ marginTop: 0, marginBottom: '1rem' }}>
        {t('sandbox.description')}
      </p>

    <section style={{ marginBottom: '1.25rem' }}>
      <h2 style={{ marginBottom: '0.5rem' }}>
        {t('sandbox.parametersSectionTitle')}
      </h2>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>{t('sandbox.blindLabel')}</span>
            <input
              type="number"
              min={0}
              value={blind}
              onChange={e => setBlind(Number(e.target.value))}
              style={{ padding: '0.5rem', minWidth: 160 }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>{t('sandbox.winningOutcomeLabel')}</span>
            <input
              type="text"
              value={winningOutcome}
              onChange={e => setWinningOutcome(e.target.value)}
              style={{ padding: '0.5rem', minWidth: 200 }}
            />
          </label>
        </div>
      </section>

      <section style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>
          {t('sandbox.betsSectionTitle')}
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 2fr 1fr auto',
            gap: '0.5rem',
            alignItems: 'center',
          }}
        >
          <strong>{t('sandbox.playerIdLabel')}</strong>
          <strong>{t('sandbox.outcomeLabel')}</strong>
          <strong>{t('sandbox.stakeLabel')}</strong>
          <span />
          {bets.map(bet => (
            <Fragment key={bet.id}>
              <input
                type="text"
                value={bet.playerId}
                onChange={e =>
                  handleBetChange(bet.id, 'playerId', e.target.value)
                }
                style={{ padding: '0.5rem' }}
              />
              <input
                type="text"
                value={bet.outcome}
                onChange={e => handleBetChange(bet.id, 'outcome', e.target.value)}
                style={{ padding: '0.5rem' }}
              />
              <input
                type="number"
                min={0}
                value={bet.stake}
                onChange={e => handleBetChange(bet.id, 'stake', e.target.value)}
                style={{ padding: '0.5rem' }}
              />
              <button
                onClick={() => handleRemoveBet(bet.id)}
                style={{ padding: '0.35rem 0.5rem' }}
              >
                {t('sandbox.removeBet')}
              </button>
            </Fragment>
          ))}
        </div>
        <button
          onClick={handleAddBet}
          style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem' }}
        >
          {t('sandbox.addBet')}
        </button>
      </section>

      <button
        onClick={handleCalculate}
        style={{ padding: '0.65rem 1rem', marginBottom: '1rem' }}
      >
        {t('sandbox.calculateButton')}
      </button>

      <section>
        <h2 style={{ marginBottom: '0.5rem' }}>
          {t('sandbox.resultsSectionTitle')}
        </h2>
        {!result ? (
          <p>{t('sandbox.noResults')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
              <strong>{t('sandbox.totalWageredLabel')}:</strong> {result.totalWagered}
            </div>
            <div>
              <strong>{t('sandbox.totalPotLabel')}:</strong> {result.totalPot}
            </div>
            <div>
              <strong>{t('sandbox.removedFromGameLabel')}:</strong>{' '}
              {result.removedFromGame}
            </div>

            <div>
              <h3 style={{ marginBottom: '0.35rem' }}>
                {t('sandbox.payoutsSectionTitle')}
              </h3>
              {playerIds.length === 0 ? (
                <p>{t('sandbox.noResults')}</p>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr',
                    gap: '0.5rem',
                    alignItems: 'center',
                  }}
                >
                  <strong>{t('sandbox.playerIdLabel')}</strong>
                  <strong>{t('sandbox.payoutLabel')}</strong>
                  {playerIds.map(id => (
                    <Fragment key={`payout-${id}`}>
                      <span>{id}</span>
                      <span>{result.payouts[id] ?? 0}</span>
                    </Fragment>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
