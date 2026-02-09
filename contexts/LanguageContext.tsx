import React, { createContext, useState, useEffect, ReactNode, FC } from 'react';
import en from '../i18n/locales/en.json';
import it from '../i18n/locales/it.json';

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
  t: (key: string) => string;
}

const translations: { [key: string]: { [key: string]: string } } = { en, it };

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string>(localStorage.getItem('botanica_ai_lang') || 'en');

  useEffect(() => {
    localStorage.setItem('botanica_ai_lang', language);
  }, [language]);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
