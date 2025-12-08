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
}

export default en
export type EnMessages = typeof en
