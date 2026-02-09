import React, { createContext, useState, useEffect, ReactNode, FC, useCallback, useRef } from 'react';
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

// Detect initial language from browser/system
const detectBrowserLanguage = (): string => {
  const browserLang = navigator.language || (navigator as any).userLanguage || 'en';
  // Check if starts with 'it' (covers it, it-IT, it-CH, etc.)
  if (browserLang.toLowerCase().startsWith('it')) {
    return 'it';
  }
  return 'en';
};

// Get initial language: localStorage > browser detection
const getInitialLanguage = (): string => {
  const saved = localStorage.getItem('botanica_ai_lang');
  if (saved && (saved === 'en' || saved === 'it')) {
    return saved;
  }
  return detectBrowserLanguage();
};

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<string>(getInitialLanguage());
  const [isLanguageLoaded, setIsLanguageLoaded] = useState(false);
  const hasCheckedGeolocation = useRef(false);

  // Detect language from geolocation (Italy → Italian)
  const detectLanguageFromGeolocation = useCallback(async (): Promise<string | null> => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      
      // Reverse geocode to get country
      const { latitude, longitude } = position.coords;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`
      );
      
      if (!response.ok) return null;
      
      const data = await response.json();
      const countryCode = data.address?.country_code?.toLowerCase();
      
      if (countryCode === 'it') {
        return 'it';
      }
      return 'en';
    } catch (e) {
      console.warn('Geolocation language detection failed:', e);
      return null;
    }
  }, []);

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
          setIsLanguageLoaded(true);
          return; // User has explicit preference, don't use geolocation
        }
        
        // No saved preference: try geolocation detection (only once)
        if (!hasCheckedGeolocation.current && !localStorage.getItem('botanica_ai_lang')) {
          hasCheckedGeolocation.current = true;
          const geoLang = await detectLanguageFromGeolocation();
          if (geoLang && geoLang !== language) {
            setLanguageState(geoLang);
            localStorage.setItem('botanica_ai_lang', geoLang);
            // Also save to Supabase for next time
            await supabaseService.saveLanguagePreference(user.id, geoLang);
          }
        }
      } catch (e) {
        console.warn('Could not load language preference from Supabase:', e);
      } finally {
        setIsLanguageLoaded(true);
      }
    };

    loadPreference();
  }, [user, language, detectLanguageFromGeolocation]);

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
