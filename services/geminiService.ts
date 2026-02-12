import { Plant, Coords, WeatherInfo, PersistentTask, StructuredCarePlan, StructuredCarePlanResponse } from '../types';
import { marked } from 'marked';
import { supabase } from './supabaseClient';

// Fallback to project-specific URL if env var not set
const SUPABASE_PROJECT_REF = 'khkwrkmsikpsrkeiwvjm';
const EDGE_FUNCTION_URL = import.meta.env.VITE_SUPABASE_EDGE_FUNCTION_URL || 
  `https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1`;

const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const callGeminiEdgeFunction = async (action: string, payload: Record<string, any>) => {
  // Refresh session to ensure token is valid
  const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
  
  if (refreshError) {
    console.error('Session refresh error:', refreshError);
    // Try to get existing session even if refresh failed
    const { data: { session: existingSession } } = await supabase.auth.getSession();
    if (!existingSession?.access_token) {
      throw new Error('Session expired. Please sign in again.');
    }
  }
  
  // Try user token first, fallback to anon key for anonymous access
  let token = session?.access_token;
  
  if (!token) {
    console.warn('No user session, falling back to anon key');
    token = SUPABASE_ANON_KEY;
  }
  
  if (!token) {
    throw new Error('No authentication token available.');
  }
  
  const response = await fetch(`${EDGE_FUNCTION_URL}/gemini`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ action, ...payload }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Edge function error:', error);
    throw new Error(`Edge function error: ${error}`);
  }

  return response.json();
};

const languageNames: Record<string, string> = {
  en: 'English',
  it: 'Italian',
};
const getLanguageName = (code: string): string => languageNames[code] || code;

const getWeatherConditionLabel = (code: number): string => {
  const conditions: Record<number, string> = {
    0: 'Clear', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Rime fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle',
    56: 'Freezing drizzle', 57: 'Heavy freezing drizzle',
    61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
    66: 'Freezing rain', 67: 'Heavy freezing rain',
    71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
    80: 'Light showers', 81: 'Showers', 82: 'Heavy showers',
    85: 'Light snow showers', 86: 'Heavy snow showers',
    95: 'Thunderstorm', 96: 'Thunderstorm + hail', 99: 'Thunderstorm + heavy hail',
  };
  return conditions[code] || 'Unknown';
};

const formatForecastContext = (weather: WeatherInfo | null | undefined): string => {
  if (!weather) return 'Weather data unavailable.';

  let ctx = `Current weather: ${weather.temperature}°C, ${weather.condition}.`;

  if (weather.forecast?.daily) {
    const { time, temperature_2m_max, temperature_2m_min, weather_code, precipitation_sum } = weather.forecast.daily;
    ctx += `\n\n7-day forecast:`;
    for (let i = 0; i < time.length; i++) {
      const minT = Math.round(temperature_2m_min[i]);
      const maxT = Math.round(temperature_2m_max[i]);
      const cond = getWeatherConditionLabel(weather_code[i]);
      const rain = precipitation_sum[i];
      const frost = minT <= 0 ? ' ⚠️ FROST RISK' : '';
      ctx += `\n- ${time[i]}: ${minT}°C / ${maxT}°C, ${cond}, ${rain}mm rain${frost}`;
    }
  }

  return ctx;
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error('Failed to read file as base64 string.'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

export const identifyPlant = async (
  base64Image: string,
  mimeType: string,
  language: string
): Promise<{ name: string; description: string; careNeeds: string; imageUrl: string }> => {
  const result = await callGeminiEdgeFunction('identifyPlant', {
    base64Image,
    mimeType,
    language,
  });

  // After identification, get image via search
  const imageResult = await searchPlantByName(result.name, language);
  return {
    name: result.name,
    description: result.description,
    careNeeds: result.careNeeds,
    imageUrl: imageResult.imageUrl,
  };
};

export const searchPlantByName = async (
  plantName: string,
  language: string
): Promise<{ name: string; description: string; careNeeds: string; imageUrl: string }> => {
  return await callGeminiEdgeFunction('searchPlantByName', {
    plantName,
    language,
  });
};

export const generateDetailedCarePlan = async (
  plant: Plant,
  language: string,
  options: { 
    format?: 'markdown' | 'json' | 'both';
    forceRegenerate?: boolean;
    cachedPlan?: StructuredCarePlan | null;
  } = {}
): Promise<StructuredCarePlanResponse & { fromCache: boolean }> => {
  // Se c'è un piano in cache e non è richiesta la rigenerazione forzata, usa cache
  if (!options.forceRegenerate && options.cachedPlan) {
    return {
      structured: options.cachedPlan,
      markdown: undefined,
      fromCache: true,
    };
  }

  const result = await callGeminiEdgeFunction('generateDetailedCarePlan', {
    plantName: plant.name,
    description: plant.description,
    careNeeds: plant.careNeeds,
    language,
    format: options.format || 'json',
  });

  // If server returns structured data
  if (result.structured) {
    return {
      structured: result.structured as StructuredCarePlan,
      markdown: result.markdown,
      fromCache: false,
    };
  }

  // Fallback: if server only returns markdown (legacy)
  return {
    structured: {
      watering: { frequency: '', amount: '' },
      sunlight: { requirement: '' },
      soil: { type: '' },
    },
    markdown: result.markdown,
    fromCache: false,
  };
};

// Helper to convert structured care plan to HTML for display
export const carePlanToHtml = (carePlan: StructuredCarePlan, language: string = 'en'): string => {
  const t = (en: string, it: string) => language === 'it' ? it : en;

  let html = '<div class="care-plan">';

  // Watering
  if (carePlan.watering) {
    html += `<section class="care-section"><h3>${t('💧 Watering', '💧 Irrigazione')}</h3>`;
    html += `<p><strong>${t('Frequency', 'Frequenza')}:</strong> ${carePlan.watering.frequency}</p>`;
    html += `<p><strong>${t('Amount', 'Quantità')}:</strong> ${carePlan.watering.amount}</p>`;
    if (carePlan.watering.technique) html += `<p><strong>${t('Technique', 'Tecnica')}:</strong> ${carePlan.watering.technique}</p>`;
    if (carePlan.watering.seasonalNotes) html += `<p><strong>${t('Seasonal', 'Stagionale')}:</strong> ${carePlan.watering.seasonalNotes}</p>`;
    html += '</section>';
  }

  // Sunlight
  if (carePlan.sunlight) {
    html += `<section class="care-section"><h3>${t('☀️ Sunlight', '☀️ Luce solare')}</h3>`;
    html += `<p><strong>${t('Requirement', 'Requisito')}:</strong> ${carePlan.sunlight.requirement}</p>`;
    if (carePlan.sunlight.hoursPerDay) html += `<p><strong>${t('Hours per Day', 'Ore al giorno')}:</strong> ${carePlan.sunlight.hoursPerDay}</p>`;
    if (carePlan.sunlight.placement) html += `<p><strong>${t('Placement', 'Posizionamento')}:</strong> ${carePlan.sunlight.placement}</p>`;
    html += '</section>';
  }

  // Soil
  if (carePlan.soil) {
    html += `<section class="care-section"><h3>${t('🌱 Soil', '🌱 Terreno')}</h3>`;
    html += `<p><strong>${t('Type', 'Tipo')}:</strong> ${carePlan.soil.type}</p>`;
    if (carePlan.soil.ph) html += `<p><strong>pH:</strong> ${carePlan.soil.ph}</p>`;
    if (carePlan.soil.amendments) html += `<p><strong>${t('Amendments', 'Miglioramenti')}:</strong> ${carePlan.soil.amendments}</p>`;
    html += '</section>';
  }

  // Fertilizing
  if (carePlan.fertilizing) {
    html += `<section class="care-section"><h3>${t('🧪 Fertilizing', '🧪 Fertilizzazione')}</h3>`;
    html += `<p><strong>${t('Type', 'Tipo')}:</strong> ${carePlan.fertilizing.type}</p>`;
    html += `<p><strong>${t('Frequency', 'Frequenza')}:</strong> ${carePlan.fertilizing.frequency}</p>`;
    if (carePlan.fertilizing.timing) html += `<p><strong>${t('Timing', 'Periodo')}:</strong> ${carePlan.fertilizing.timing}</p>`;
    html += '</section>';
  }

  // Pruning
  if (carePlan.pruning) {
    html += `<section class="care-section"><h3>${t('✂️ Pruning', '✂️ Potatura')}</h3>`;
    if (carePlan.pruning.timing) html += `<p><strong>${t('When', 'Quando')}:</strong> ${carePlan.pruning.timing}</p>`;
    if (carePlan.pruning.technique) html += `<p><strong>${t('How', 'Come')}:</strong> ${carePlan.pruning.technique}</p>`;
    if (carePlan.pruning.frequency) html += `<p><strong>${t('Frequency', 'Frequenza')}:</strong> ${carePlan.pruning.frequency}</p>`;
    html += '</section>';
  }

  // Temperature
  if (carePlan.temperature) {
    html += `<section class="care-section"><h3>${t('🌡️ Temperature', '🌡️ Temperatura')}</h3>`;
    if (carePlan.temperature.idealRange) html += `<p><strong>${t('Ideal Range', 'Range ideale')}:</strong> ${carePlan.temperature.idealRange}</p>`;
    if (carePlan.temperature.hardiness) html += `<p><strong>${t('Hardiness', 'Resistenza')}:</strong> ${carePlan.temperature.hardiness}</p>`;
    if (carePlan.temperature.humidity) html += `<p><strong>${t('Humidity', 'Umidità')}:</strong> ${carePlan.temperature.humidity}</p>`;
    html += '</section>';
  }

  // Pests
  if (carePlan.pests) {
    html += `<section class="care-section"><h3>${t('🐛 Pests & Diseases', '🐛 Parassiti e malattie')}</h3>`;
    if (carePlan.pests.common) html += `<p><strong>${t('Common', 'Comuni')}:</strong> ${carePlan.pests.common}</p>`;
    if (carePlan.pests.prevention) html += `<p><strong>${t('Prevention', 'Prevenzione')}:</strong> ${carePlan.pests.prevention}</p>`;
    if (carePlan.pests.treatment) html += `<p><strong>${t('Treatment', 'Trattamento')}:</strong> ${carePlan.pests.treatment}</p>`;
    html += '</section>';
  }

  // Repotting
  if (carePlan.repotting) {
    html += `<section class="care-section"><h3>${t('🪴 Repotting', '🪴 Rinvaso')}</h3>`;
    if (carePlan.repotting.frequency) html += `<p><strong>${t('Frequency', 'Frequenza')}:</strong> ${carePlan.repotting.frequency}</p>`;
    if (carePlan.repotting.timing) html += `<p><strong>${t('When', 'Quando')}:</strong> ${carePlan.repotting.timing}</p>`;
    if (carePlan.repotting.potSize) html += `<p><strong>${t('Pot Size', 'Dimensione vaso')}:</strong> ${carePlan.repotting.potSize}</p>`;
    html += '</section>';
  }

  // Harvesting
  if (carePlan.harvesting) {
    html += `<section class="care-section"><h3>${t('🍎 Harvesting', '🍎 Raccolta')}</h3>`;
    if (carePlan.harvesting.timing) html += `<p><strong>${t('When', 'Quando')}:</strong> ${carePlan.harvesting.timing}</p>`;
    if (carePlan.harvesting.technique) html += `<p><strong>${t('Technique', 'Tecnica')}:</strong> ${carePlan.harvesting.technique}</p>`;
    if (carePlan.harvesting.storage) html += `<p><strong>${t('Storage', 'Conservazione')}:</strong> ${carePlan.harvesting.storage}</p>`;
    html += '</section>';
  }

  // Warnings
  if (carePlan.warnings && carePlan.warnings.length > 0) {
    html += `<section class="care-section warnings"><h3>⚠️ ${t('Warnings', 'Avvertenze')}</h3><ul>`;
    carePlan.warnings.forEach(w => html += `<li>${w}</li>`);
    html += '</ul></section>';
  }

  // Tips
  if (carePlan.tips && carePlan.tips.length > 0) {
    html += `<section class="care-section tips"><h3>💡 ${t('Tips', 'Consigli')}</h3><ul>`;
    carePlan.tips.forEach(tip => html += `<li>${tip}</li>`);
    html += '</ul></section>';
  }

  html += '</div>';
  return html;
};

// ============================================
// Annual Careplan Generation
// ============================================

interface AnnualTask {
  task: string;
  reason: string;
  category: string;
  taskNature: string;
  scheduledMonth: number;
  windowStart: string;
  windowEnd: string;
  priority: string;
}

export const generateAnnualCareplan = async (
  plant: Plant,
  coords?: Coords | null,
  weather?: WeatherInfo | null,
  language: string = 'en'
): Promise<AnnualTask[]> => {
  const result = await callGeminiEdgeFunction('generateAnnualCareplan', {
    plant,
    coords,
    weather,
    language,
  });

  return result.tasks || [];
};

// ============================================
// Biweekly Adaptation
// ============================================

interface AdaptationResult {
  newTasks: Array<{
    plantId: string;
    plantName: string;
    task: string;
    reason: string;
    category: string;
    taskNature: string;
    scheduledMonth: number;
    windowStart: string;
    windowEnd: string;
    priority: string;
  }>;
  modifications: Array<{
    taskId: string;
    newWindowStart?: string;
    newWindowEnd?: string;
    newPriority?: string;
  }>;
}

export const adaptBiweeklyTasks = async (
  plants: Plant[],
  pendingTasks: PersistentTask[],
  completedHistory: PersistentTask[],
  coords?: Coords | null,
  weather?: WeatherInfo | null,
  language: string = 'en'
): Promise<AdaptationResult> => {
  if (plants.length === 0) return { newTasks: [], modifications: [] };

  return await callGeminiEdgeFunction('adaptBiweeklyTasks', {
    plants,
    pendingTasks,
    completedHistory,
    coords,
    weather,
    language,
  });
};

// ============================================
// Legacy: generateToDoList (kept for reference)
// ============================================
export const generateToDoList = async (
  plants: Plant[],
  coords: Coords,
  weather: WeatherInfo,
  language: string
): Promise<any[]> => {
  // Legacy function - no longer used by the new persistent task system
  return [];
};

// ============================================
// Chat
// ============================================
export const chatWithBotanica = async (
  messages: { text: string; sender: 'user' | 'botanica' }[],
  plants: Plant[],
  language: string
): Promise<string> => {
  const result = await callGeminiEdgeFunction('chat', {
    messages,
    plants,
    language,
  });

  return result.response;
};
