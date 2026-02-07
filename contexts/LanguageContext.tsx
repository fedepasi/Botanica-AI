import React, { createContext, useState, useEffect, ReactNode, FC } from 'react';

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
  t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string>(localStorage.getItem('botanica_ai_lang') || 'en');
  const [translations, setTranslations] = useState<{ [key: string]: { [key: string]: string } }>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const [enResponse, itResponse] = await Promise.all([
          fetch('./i18n/locales/en.json'),
          fetch('./i18n/locales/it.json')
        ]);
        if (!enResponse.ok || !itResponse.ok) {
            throw new Error('Failed to fetch translation files');
        }
        const en = await enResponse.json();
        const it = await itResponse.json();
        setTranslations({ en, it });
      } catch (error) {
        console.error("Could not load translation files:", error);
        setTranslations({}); 
      } finally {
        setIsLoading(false);
      }
    };
    fetchTranslations();
  }, []);

  useEffect(() => {
    localStorage.setItem('botanica_ai_lang', language);
  }, [language]);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    if (isLoading) return '';
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-green-50">
        <div className="w-12 h-12 border-4 border-green-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
