import { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '@/i18n/translations';

const LanguageContext = createContext(null);

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => localStorage.getItem('lang') || 'ar');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const dir = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    localStorage.setItem('lang', language);
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language, dir]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const t = (key) => {
    const keys = key.split('.');
    let val = translations[language];
    for (const k of keys) val = val?.[k];
    return val || key;
  };

  const toggleLanguage = () => setLanguage(l => l === 'ar' ? 'en' : 'ar');
  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return (
    <LanguageContext.Provider value={{ language, dir, t, toggleLanguage, setLanguage, theme, toggleTheme }}>
      {children}
    </LanguageContext.Provider>
  );
};
