// FIX: Created types.ts to define shared data structures.
export interface Plant {
  id: string;
  name: string;
  description: string;
  careNeeds: string;
  imageUrl: string;
  notes: string;
}


export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'botanica';
  timestamp: Date;
}

export type PlantStatus = 'healthy' | 'needs_attention';

export interface CareTask {
  plantName: string;
  task: string;
  reason: string;
  timing: 'Overdue' | 'Today' | 'This Week';
  category?: 'pruning' | 'grafting' | 'watering' | 'general';
}

export interface Coords {
  latitude: number;
  longitude: number;
}

export interface WeatherInfo {
  temperature: number;
  condition: string;
  weatherCode: number;
}

export interface WeatherForecast {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  }
}