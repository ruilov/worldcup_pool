import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en'
import pt from './pt'

export const defaultLanguage = 'en'

const resources = {
  en: { translation: en },
  pt: { translation: pt },
}

const savedLang =
  (typeof window !== 'undefined' && window.localStorage.getItem('lang')) || null

const initialLang =
  savedLang && savedLang in resources ? savedLang : defaultLanguage

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLang,
    fallbackLng: defaultLanguage,
    interpolation: {
      escapeValue: false, // React already escapes
    },
  })

export function changeLanguage(lang: string) {
  if (lang in resources) {
    i18n.changeLanguage(lang)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('lang', lang)
    }
  }
}

export default i18n
