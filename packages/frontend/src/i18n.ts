import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';
import productionEnTranslations from './locales/production.en.json';
import productionEsTranslations from './locales/production.es.json';

const detectionOptions = {
  order: ['localStorage', 'navigator', 'htmlTag'],
  lookupLocalStorage: 'i18nextLng',
  caches: ['localStorage'],
  excludeCacheFor: ['cimode'],
};

const resources = {
  en: {
    translation: {
      ...enTranslations,
      ...productionEnTranslations,
    },
  },
  es: {
    translation: {
      ...esTranslations,
      ...productionEsTranslations,
    },
  },
};

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'es'],
    load: 'languageOnly',
    nonExplicitSupportedLngs: true,
    detection: detectionOptions,
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
      bindI18n: 'languageChanged',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i'],
    },
    initImmediate: false,
    returnObjects: true,
  });

function applyDocumentLanguage(language: string): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = language.split('-')[0] || 'en';
}

applyDocumentLanguage(i18n.resolvedLanguage ?? i18n.language);
i18n.on('languageChanged', applyDocumentLanguage);

export default i18n;
