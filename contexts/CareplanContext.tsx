import React, { createContext, useState, useEffect, ReactNode, FC, useCallback } from 'react';
import { CareTask, Coords, WeatherInfo } from '../types';
import { useGarden } from '../hooks/useGarden';
import { generateToDoList } from '../services/geminiService';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from './AuthContext';
import { supabaseService } from '../services/supabaseService';

interface CareplanContextType {
  tasks: CareTask[];
  weather: WeatherInfo | null;
  isLoading: boolean;
  error: string | null;
  refreshCareplan: () => void;
}

export const CareplanContext = createContext<CareplanContextType | undefined>(undefined);

const getWeatherCondition = (code: number): string => {
    const conditions: { [key: number]: string } = {
        0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
        45: 'Fog', 48: 'Depositing rime fog',
        51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
        56: 'Light freezing drizzle', 57: 'Dense freezing drizzle',
        61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
        66: 'Light freezing rain', 67: 'Heavy freezing rain',
        71: 'Slight snow fall', 73: 'Moderate snow fall', 75: 'Heavy snow fall',
        77: 'Snow grains',
        80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
        85: 'Slight snow showers', 86: 'Heavy snow showers',
        95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail',
    };
    return conditions[code] || 'Unknown';
};

export const CareplanProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { plants, isLoaded: isGardenLoaded } = useGarden();
  const { language } = useTranslation();
  const { user } = useAuth();

  const [tasks, setTasks] = useState<CareTask[]>([]);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateCareplan = useCallback(async (forceRefresh = false) => {
    if (!isGardenLoaded || !language || !user) return;

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Check Supabase for a cached plan (unless forced refresh)
    if (!forceRefresh) {
      try {
        const cached = await supabaseService.getCareplan(user.id, today, plants.length, language);
        if (cached) {
          setTasks(cached.tasks || []);
          setWeather(cached.weather || null);
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.warn('Could not fetch cached careplan from Supabase:', e);
      }
    }

    setIsLoading(true);
    setError(null);

    // Get location and weather (non-blocking — dashboard works without it)
    let currentCoords: Coords | null = null;
    let weatherInfo: WeatherInfo | null = null;
    try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
        });
        currentCoords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
        };

        const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${currentCoords.latitude}&longitude=${currentCoords.longitude}&current=temperature_2m,weather_code`
        );
        if (!weatherResponse.ok) throw new Error('Failed to fetch weather data.');

        const weatherData = await weatherResponse.json();
        const currentWeather = weatherData.current;
        weatherInfo = {
            temperature: Math.round(currentWeather.temperature_2m),
            condition: getWeatherCondition(currentWeather.weather_code),
            weatherCode: currentWeather.weather_code,
        };
        setWeather(weatherInfo);

    } catch (e) {
        console.warn('Could not get location or weather:', e);
    }

    // Generate to-do list if there are plants and we have location data
    let generatedTasks: CareTask[] = [];
    if (plants.length > 0 && currentCoords && weatherInfo) {
        try {
            generatedTasks = await generateToDoList(plants, currentCoords, weatherInfo, language);
            setTasks(generatedTasks);
        } catch(e) {
            const msg = e instanceof Error ? e.message : 'Could not generate care tasks from AI.';
            setError(`Failed to generate plan: ${msg}`);
            setTasks([]);
        }
    } else {
        setTasks([]);
    }

    // Save to Supabase
    try {
      await supabaseService.saveCareplan(user.id, generatedTasks, weatherInfo, plants.length, language);
    } catch (e) {
      console.warn('Could not save careplan to Supabase:', e);
    }

    setIsLoading(false);

  }, [isGardenLoaded, plants, language, user]);

  useEffect(() => {
    generateCareplan();
  }, [generateCareplan]);

  const refreshCareplan = () => {
    generateCareplan(true);
  };

  const value = { tasks, weather, isLoading, error, refreshCareplan };

  return (
    <CareplanContext.Provider value={value}>
      {children}
    </CareplanContext.Provider>
  );
};
