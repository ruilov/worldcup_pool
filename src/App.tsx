import { useTranslation } from 'react-i18next'
import { changeLanguage } from './i18n'
import { PayoutSandbox } from './components/PayoutSandbox'

function App() {
  const { i18n } = useTranslation()

  const handleLanguageChange = (lang: string) => {
    changeLanguage(lang)
  }

  return (
    <div
      style={{
        padding: '2rem',
        fontFamily: 'sans-serif',
        maxWidth: 960,
        margin: '0 auto',
      }}
    >
      <Header
        currentLang={i18n.language}
        onLanguageChange={handleLanguageChange}
      />

      <PayoutSandbox />
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
