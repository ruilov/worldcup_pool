import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from './supabaseClient'
import { changeLanguage } from './i18n'

function App() {
  const { t, i18n } = useTranslation()
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
        setError(t('settings.loadError'))
      } else if (data) {
        setValue(String(data.value))
      }

      setLoading(false)
    }

    void load()
    // t is stable enough here for this usage, but to be safe we don't add it as a dep
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    const numericValue = Number(value)
    if (Number.isNaN(numericValue)) {
      setError(t('settings.invalidNumber'))
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('settings')
      .update({ value: numericValue })
      .eq('id', 1)

    if (error) {
      console.error(error)
      setError(t('settings.saveError'))
    } else {
      setSuccess(t('settings.saved'))
    }

    setSaving(false)
  }

  const handleLanguageChange = (lang: string) => {
    changeLanguage(lang)
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <Header
          currentLang={i18n.language}
          onLanguageChange={handleLanguageChange}
        />
        <p>{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div
      style={{
        padding: '2rem',
        fontFamily: 'sans-serif',
        maxWidth: 480,
        margin: '0 auto',
      }}
    >
      <Header
        currentLang={i18n.language}
        onLanguageChange={handleLanguageChange}
      />

      <h1>{t('settings.heading')}</h1>
      <p>{t('settings.description')}</p>

      <label
        style={{ display: 'block', marginBottom: '0.5rem' }}
        htmlFor="db-value"
      >
        {t('settings.valueLabel')}
      </label>

      <input
        id="db-value"
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
        {saving ? t('common.loading') : t('common.save')}
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

type HeaderProps = {
  currentLang: string
  onLanguageChange: (lang: string) => void
}

function Header({ currentLang, onLanguageChange }: HeaderProps) {
  const { t } = useTranslation()

  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
      }}
    >
      <span style={{ fontWeight: 600 }}>{t('common.appName')}</span>

      <label
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <span>{t('common.language')}:</span>
        <select
          value={currentLang}
          onChange={e => onLanguageChange(e.target.value)}
        >
          <option value="en">English</option>
          <option value="pt">Português</option>
        </select>
      </label>
    </header>
  )
}

export default App
