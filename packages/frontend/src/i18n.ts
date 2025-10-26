import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';

// Language detection configuration
const detectionOptions = {
  // Order of language detection methods
  order: ['localStorage', 'navigator', 'htmlTag'],
  
  // Keys to lookup language from
  lookupLocalStorage: 'i18nextLng',
  
  // Cache user language on
  caches: ['localStorage'],
  excludeCacheFor: ['cimode'],
};

// Initialize i18next immediately with synchronous configuration
i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Init i18next - MUST be synchronous to avoid blank screen
  .init({
    // Resources - load synchronously
    resources: {
      en: {
        translation: enTranslations,
      },
      es: {
        translation: esTranslations,
      },
    },
    
    // Fallback language
    fallbackLng: 'en',
    lng: 'en', // Default to English on first load
    
    // Supported languages
    supportedLngs: ['en', 'es'],
    
    // Language detection configuration
    detection: detectionOptions,
    
    // CRITICAL: Disable debug to prevent console spam
    debug: false,
    
    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes
    },
    
    // CRITICAL: React options - disable Suspense to prevent blank screen
    react: {
      useSuspense: false, // Changed to false to prevent blank screen issues
      bindI18n: 'languageChanged',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i'],
    },
    
    // Load resources synchronously
    initImmediate: false,
    
    // Return objects for nested translations
    returnObjects: true,
  });

export default i18n;
