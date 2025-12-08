import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [value, setValue] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Load value from Supabase on first render
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('id', 1)
        .single()

      if (error) {
        console.error(error)
        setError('Failed to load value from database.')
      } else if (data) {
        setValue(String(data.value))
      }

      setLoading(false)
    }

    void load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    const numericValue = Number(value)
    if (Number.isNaN(numericValue)) {
      setError('Please enter a valid number.')
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('settings')
      .update({ value: numericValue })
      .eq('id', 1)

    if (error) {
      console.error(error)
      setError('Failed to save value.')
    } else {
      setSuccess('Saved!')
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <h1>World Cup Pool (Prototype)</h1>
        <p>Loading current value…</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: 480 }}>
      <h1>World Cup Pool (Prototype)</h1>
      <p>
        This is a simple test: a single number stored in Supabase. Anyone can read and update it
        (no authentication yet).
      </p>

      <label style={{ display: 'block', marginBottom: '0.5rem' }}>
        Value in database:
      </label>

      <input
        type="number"
        value={value}
        onChange={e => setValue(e.target.value)}
        style={{ padding: '0.5rem', width: '100%', marginBottom: '0.75rem' }}
      />

      <button
        onClick={handleSave}
        disabled={saving}
        style={{ padding: '0.5rem 1rem' }}
      >
        {saving ? 'Saving…' : 'Save'}
      </button>

      {error && (
        <p style={{ color: 'red', marginTop: '0.75rem' }}>
          {error}
        </p>
      )}

      {success && (
        <p style={{ color: 'green', marginTop: '0.75rem' }}>
          {success}
        </p>
      )}
    </div>
  )
}

export default App
