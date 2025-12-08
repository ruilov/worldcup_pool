import { useTranslation } from 'react-i18next'
import { changeLanguage } from './i18n'
import { MatchList } from './components/MatchList'
import { useDefaultChallenge } from './hooks/useDefaultChallenge'
import styles from './App.module.css'

function App() {
  const { i18n, t } = useTranslation()
  const { challenge, loading: challengeLoading } = useDefaultChallenge()

  const handleLanguageChange = (lang: string) => {
    changeLanguage(lang)
  }

  return (
    <div className={styles.app}>
      <div className={styles.container}>
        <Header
          currentLang={i18n.language}
          onLanguageChange={handleLanguageChange}
        />

        {challengeLoading ? (
          <div className={styles.loading}>{t('matches.loadingChallenge')}</div>
        ) : challenge ? (
          <MatchList challengeId={challenge.id} />
        ) : (
          <div className={styles.error}>{t('matches.noChallengeFound')}</div>
        )}
      </div>
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
    <header className={styles.header}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>⚽</span>
        <div>
          <h1 className={styles.logoText}>
            {t('common.appName')}
            <span className={styles.logoSubtext}>2026</span>
          </h1>
        </div>
      </div>

      <div className={styles.languageSelector}>
        <label className={styles.languageLabel} htmlFor="language-select">
          {t('common.language')}
        </label>
        <select
          id="language-select"
          className={styles.languageSelect}
          value={currentLang}
          onChange={e => onLanguageChange(e.target.value)}
        >
          <option value="en">English</option>
          <option value="pt">Português</option>
        </select>
      </div>
    </header>
  )
}

export default App
