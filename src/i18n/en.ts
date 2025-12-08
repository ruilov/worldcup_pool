const en = {
  common: {
    appName: 'World Cup Pool',
    loading: 'Loading…',
    save: 'Save',
    language: 'Language',
  },
  settings: {
    heading: 'World Cup Pool (Prototype)',
    description:
      'This is a simple test: a single number stored in Supabase. Anyone can read and update it (no authentication yet).',
    valueLabel: 'Value in database:',
    saved: 'Saved!',
    saveError: 'Failed to save value.',
    loadError: 'Failed to load value from database.',
    invalidNumber: 'Please enter a valid number.',
  },
  sandbox: {
    heading: 'Payout sandbox',
    description:
      'Try different blinds, bets, and outcomes to see how the pot and payouts are calculated.',
    blindLabel: 'Blind (T$)',
    winningOutcomeLabel: 'Winning outcome',
    parametersSectionTitle: 'Parameters',
    betsSectionTitle: 'Bets',
    playerIdLabel: 'Player',
    outcomeLabel: 'Outcome',
    stakeLabel: 'Stake (T$)',
    payoutLabel: 'Payout (T$)',
    addBet: 'Add bet',
    removeBet: 'Remove',
    calculateButton: 'Calculate payouts',
    resultsSectionTitle: 'Results',
    totalWageredLabel: 'Total wagered',
    totalPotLabel: 'Total pot',
    removedFromGameLabel: 'Removed from game',
    payoutsSectionTitle: 'Payouts',
    noResults: 'No results yet. Enter data and calculate.',
  },
}

export default en
export type EnMessages = typeof en
