import React, { createContext, useState, useEffect, ReactNode, FC, useCallback } from 'react';
import en from '../i18n/locales/en.json';
import it from '../i18n/locales/it.json';
import { useAuth } from './AuthContext';
import { supabaseService } from '../services/supabaseService';

interface LanguageContextType {
  language: string;
  isLanguageLoaded: boolean;
  setLanguage: (language: string) => void;
  t: (key: string) => string;
}

const translations: { [key: string]: { [key: string]: string } } = { en, it };

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<string>(localStorage.getItem('botanica_ai_lang') || 'en');
  const [isLanguageLoaded, setIsLanguageLoaded] = useState(false);

  // On login: load language preference from Supabase
  useEffect(() => {
    if (!user) {
      setIsLanguageLoaded(true);
      return;
    }

    const loadPreference = async () => {
      try {
        const saved = await supabaseService.getLanguagePreference(user.id);
        if (saved && saved !== language) {
          setLanguageState(saved);
          localStorage.setItem('botanica_ai_lang', saved);
        }
      } catch (e) {
        console.warn('Could not load language preference from Supabase:', e);
      } finally {
        setIsLanguageLoaded(true);
      }
    };

    loadPreference();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const setLanguage = useCallback((lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('botanica_ai_lang', lang);

    // Persist to Supabase in background
    if (user) {
      supabaseService.saveLanguagePreference(user.id, lang).catch(e => {
        console.warn('Could not save language preference to Supabase:', e);
      });
    }
  }, [user]);

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, isLanguageLoaded, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
