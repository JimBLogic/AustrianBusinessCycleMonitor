import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

interface LanguageSwitcherProps {
  className?: string;
}

const languages = [
  {
    code: 'en',
    name: 'English',
    flag: '🇺🇸',
    nativeName: 'English'
  },
  {
    code: 'es',
    name: 'Spanish',
    flag: '🇪🇸',
    nativeName: 'Español'
  }
];

export default function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(i18n.language);

  useEffect(() => {
    setCurrentLang(i18n.language);
  }, [i18n.language]);

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
    
    // Save to localStorage for persistence
    localStorage.setItem('i18nextLng', langCode);
    
    // Update HTML lang attribute for accessibility
    document.documentElement.lang = langCode;
  };

  const getCurrentLanguage = () => {
    return languages.find(lang => lang.code === currentLang.split('-')[0]) || languages[0];
  };

  const currentLanguage = getCurrentLanguage();

  return (
    <div className={`relative ${className}`}>
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 
                   border border-slate-600 transition-colors duration-200 text-white"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        aria-label={t('header.language')}
        aria-expanded={isOpen}
      >
        <span className="text-2xl" role="img" aria-label={currentLanguage.name}>
          {currentLanguage.flag}
        </span>
        <span className="font-medium text-sm hidden sm:inline">
          {currentLanguage.nativeName}
        </span>
        <motion.svg
          className="w-4 h-4 transition-transform"
          style={{ rotate: isOpen ? 180 : 0 }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-56 rounded-lg bg-slate-800 border border-slate-600 
                         shadow-xl z-50 overflow-hidden"
            >
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {t('header.language')}
                </div>
                
                {languages.map((lang) => {
                  const isActive = lang.code === currentLang.split('-')[0];
                  
                  return (
                    <motion.button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors
                                ${isActive 
                                  ? 'bg-blue-600 text-white' 
                                  : 'hover:bg-slate-700 text-slate-200'
                                }`}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="text-2xl" role="img" aria-label={lang.name}>
                        {lang.flag}
                      </span>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-sm">
                          {lang.nativeName}
                        </div>
                        <div className="text-xs opacity-75">
                          {lang.name}
                        </div>
                      </div>
                      {isActive && (
                        <motion.svg
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </motion.svg>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <div className="border-t border-slate-600 px-3 py-2 text-xs text-slate-400">
                {t('header.currentLanguage')}: <span className="font-medium text-slate-200">{currentLanguage.nativeName}</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
