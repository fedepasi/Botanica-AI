import React, { createContext, useState, useEffect, ReactNode, FC, useCallback, useRef } from 'react';
import { PersistentTask, DisplayTask, TaskTiming, Coords, WeatherInfo, Plant } from '../types';
import { useGarden } from '../hooks/useGarden';
import { generateAnnualCareplan, adaptBiweeklyTasks } from '../services/geminiService';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from './AuthContext';
import { supabaseService } from '../services/supabaseService';

interface CareplanContextType {
  tasks: DisplayTask[];
  completedTasks: DisplayTask[];
  allTasksForCalendar: PersistentTask[];
  weather: WeatherInfo | null;
  isLoading: boolean;
  isAdapting: boolean;
  error: string | null;
  completeTask: (taskId: string, notes?: string) => Promise<void>;
  uncompleteTask: (taskId: string) => Promise<void>;
  refreshTasks: () => Promise<void>;
  generatePlanForPlant: (plant: Plant) => Promise<void>;
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

const calculateTiming = (task: PersistentTask): TaskTiming => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (task.windowStart && task.windowEnd) {
    const start = new Date(task.windowStart);
    const end = new Date(task.windowEnd);

    if (end < today) return 'overdue';

    const todayEnd = new Date(today);
    todayEnd.setDate(todayEnd.getDate() + 1);
    if (start <= todayEnd && end >= today) return 'today';

    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    if (start <= weekEnd) return 'this_week';

    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    if (start <= monthEnd) return 'this_month';

    return 'upcoming';
  }

  // Fallback to scheduledMonth
  if (task.scheduledMonth) {
    const currentMonth = now.getMonth() + 1;
    if (task.scheduledMonth < currentMonth) return 'overdue';
    if (task.scheduledMonth === currentMonth) return 'this_month';
    return 'upcoming';
  }

  return 'upcoming';
};

const toDisplayTask = (task: PersistentTask): DisplayTask => ({
  ...task,
  timing: calculateTiming(task),
});

export const CareplanProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { plants, isLoaded: isGardenLoaded } = useGarden();
  const { language, isLanguageLoaded } = useTranslation();
  const { user } = useAuth();

  const [allTasks, setAllTasks] = useState<PersistentTask[]>([]);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdapting, setIsAdapting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const coordsRef = useRef<Coords | null>(null);
  const weatherRef = useRef<WeatherInfo | null>(null);
  const hasInitialized = useRef(false);

  // Fetch weather with 7-day forecast (fire-and-forget)
  const fetchWeatherForCoords = useCallback(async (coords: Coords) => {
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum&forecast_days=7&timezone=auto`
    );
    if (!weatherResponse.ok) return;

    const weatherData = await weatherResponse.json();
    const current = weatherData.current;
    const weatherInfo: WeatherInfo = {
      temperature: Math.round(current.temperature_2m),
      condition: getWeatherCondition(current.weather_code),
      weatherCode: current.weather_code,
      forecast: weatherData.daily ? {
        daily: {
          time: weatherData.daily.time,
          temperature_2m_max: weatherData.daily.temperature_2m_max,
          temperature_2m_min: weatherData.daily.temperature_2m_min,
          weather_code: weatherData.daily.weather_code,
          precipitation_sum: weatherData.daily.precipitation_sum,
        }
      } : undefined,
    };
    setWeather(weatherInfo);
    weatherRef.current = weatherInfo;
    coordsRef.current = coords;
  }, []);

  const fetchWeather = useCallback(async () => {
    // Try user geolocation first
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });
      await fetchWeatherForCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      return;
    } catch (e) {
      console.warn('Geolocation failed, falling back to plant coordinates:', e);
    }

    // Fallback: use first plant with coordinates
    const plantWithCoords = plants.find(p => p.latitude && p.longitude);
    if (plantWithCoords) {
      try {
        await fetchWeatherForCoords({
          latitude: plantWithCoords.latitude!,
          longitude: plantWithCoords.longitude!,
        });
      } catch (e) {
        console.warn('Could not fetch weather from plant coordinates:', e);
      }
    }
  }, [plants, fetchWeatherForCoords]);

  // Load persistent tasks from DB
  const loadTasks = useCallback(async () => {
    if (!user) return;
    try {
      const tasks = await supabaseService.getTasksForUser(user.id);
      setAllTasks(tasks);
    } catch (e) {
      console.error('Failed to load tasks:', e);
      setError('Failed to load tasks');
    }
  }, [user]);

  // Check and run biweekly adaptation
  const checkAdaptation = useCallback(async () => {
    if (!user || plants.length === 0) return;

    try {
      const needsAdaptation = await supabaseService.shouldAdapt(user.id);
      if (!needsAdaptation) return;

      setIsAdapting(true);

      // Get pending tasks for the next 30 days
      const pendingTasks = allTasks.filter(t => t.status === 'pending');
      const completedHistory = await supabaseService.getCompletedTaskHistory(user.id, 3);

      const result = await adaptBiweeklyTasks(
        plants,
        pendingTasks,
        completedHistory,
        coordsRef.current,
        weatherRef.current,
        language
      );

      let tasksAdded = 0;
      let tasksModified = 0;

      // Create new tasks
      if (result.newTasks.length > 0) {
        const batchId = `adapt_${Date.now()}`;
        // Group by plantId
        const grouped = new Map<string, typeof result.newTasks>();
        for (const t of result.newTasks) {
          const existing = grouped.get(t.plantId) || [];
          existing.push(t);
          grouped.set(t.plantId, existing);
        }

        for (const [plantId, tasks] of grouped) {
          await supabaseService.createTasks(
            user.id,
            plantId,
            tasks[0].plantName,
            tasks,
            language,
            batchId
          );
        }
        tasksAdded = result.newTasks.length;
      }

      // Apply modifications
      for (const mod of result.modifications) {
        if (mod.newWindowStart && mod.newWindowEnd) {
          await supabaseService.updateTaskWindow(
            mod.taskId,
            user.id,
            mod.newWindowStart,
            mod.newWindowEnd,
            mod.newPriority
          );
          tasksModified++;
        }
      }

      await supabaseService.recordAdaptation(user.id, weatherRef.current, tasksAdded, tasksModified);

      // Reload tasks
      await loadTasks();
    } catch (e) {
      console.error('Adaptation failed:', e);
    } finally {
      setIsAdapting(false);
    }
  }, [user, plants, allTasks, language, loadTasks]);

  // Migration: generate plans for existing plants without tasks
  const migrateExistingPlants = useCallback(async () => {
    if (!user || plants.length === 0) return;

    for (const plant of plants) {
      const hasTasks = await supabaseService.hasTasksForPlant(plant.id, user.id);
      if (!hasTasks) {
        try {
          const annualTasks = await generateAnnualCareplan(
            plant,
            coordsRef.current,
            weatherRef.current,
            language
          );
          if (annualTasks.length > 0) {
            const batchId = `annual_${plant.id}_${Date.now()}`;
            await supabaseService.createTasks(user.id, plant.id, plant.name, annualTasks, language, batchId);
          }
        } catch (e) {
          console.error(`Failed to generate annual plan for ${plant.name}:`, e);
        }
      }
    }

    await loadTasks();
  }, [user, plants, language, loadTasks]);

  // Main initialization
  useEffect(() => {
    if (!isGardenLoaded || !isLanguageLoaded || !language || !user || hasInitialized.current) return;
    hasInitialized.current = true;

    const init = async () => {
      setIsLoading(true);
      setError(null);

      // 1. Fetch weather (fire-and-forget, doesn't block)
      fetchWeather();

      // 2. Load tasks from DB
      await loadTasks();

      setIsLoading(false);

      // 3. Migrate existing plants (background)
      await migrateExistingPlants();

      // 4. Check adaptation (background)
      await checkAdaptation();
    };

    init();
  }, [isGardenLoaded, isLanguageLoaded, language, user, fetchWeather, loadTasks, migrateExistingPlants, checkAdaptation]);

  // Complete a task
  const completeTask = useCallback(async (taskId: string, notes?: string) => {
    if (!user) return;
    try {
      await supabaseService.completeTask(taskId, user.id, weatherRef.current, notes);
      setAllTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, status: 'completed' as const, completedAt: new Date().toISOString() } : t
      ));
    } catch (e) {
      console.error('Failed to complete task:', e);
    }
  }, [user]);

  // Uncomplete a task
  const uncompleteTask = useCallback(async (taskId: string) => {
    if (!user) return;
    try {
      await supabaseService.uncompleteTask(taskId, user.id);
      setAllTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, status: 'pending' as const, completedAt: null } : t
      ));
    } catch (e) {
      console.error('Failed to uncomplete task:', e);
    }
  }, [user]);

  // Refresh tasks
  const refreshTasks = useCallback(async () => {
    setIsLoading(true);
    await loadTasks();
    setIsLoading(false);
  }, [loadTasks]);

  // Generate plan for a newly added plant
  const generatePlanForPlant = useCallback(async (plant: Plant) => {
    if (!user) return;
    try {
      const annualTasks = await generateAnnualCareplan(
        plant,
        coordsRef.current,
        weatherRef.current,
        language
      );
      if (annualTasks.length > 0) {
        const batchId = `annual_${plant.id}_${Date.now()}`;
        await supabaseService.createTasks(user.id, plant.id, plant.name, annualTasks, language, batchId);
        await loadTasks();
      }
    } catch (e) {
      console.error(`Failed to generate plan for ${plant.name}:`, e);
    }
  }, [user, language, loadTasks]);

  // Compute display tasks
  const pendingDisplayTasks = allTasks
    .filter(t => t.status === 'pending')
    .map(toDisplayTask)
    .filter(t => t.timing === 'overdue' || t.timing === 'today' || t.timing === 'this_week' || t.timing === 'this_month');

  // Sort: overdue first, then today, then this_week, then this_month
  const timingOrder: Record<TaskTiming, number> = {
    overdue: 0,
    today: 1,
    this_week: 2,
    this_month: 3,
    upcoming: 4,
  };
  pendingDisplayTasks.sort((a, b) => timingOrder[a.timing] - timingOrder[b.timing]);

  // Recently completed (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const completedDisplayTasks = allTasks
    .filter(t => t.status === 'completed' && t.completedAt && new Date(t.completedAt) >= sevenDaysAgo)
    .map(toDisplayTask);

  const value: CareplanContextType = {
    tasks: pendingDisplayTasks,
    completedTasks: completedDisplayTasks,
    allTasksForCalendar: allTasks,
    weather,
    isLoading,
    isAdapting,
    error,
    completeTask,
    uncompleteTask,
    refreshTasks,
    generatePlanForPlant,
  };

  return (
    <CareplanContext.Provider value={value}>
      {children}
    </CareplanContext.Provider>
  );
};
