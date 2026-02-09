export interface Plant {
  id: string;
  name: string;
  description: string;
  careNeeds: string;
  imageUrl: string;
  notes: string;
  latitude?: number;
  longitude?: number;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'botanica';
  timestamp: Date;
}

export type PlantStatus = 'healthy' | 'needs_attention';

export type TaskCategory =
  | 'watering'
  | 'pruning'
  | 'grafting'
  | 'seeding'
  | 'fertilizing'
  | 'harvesting'
  | 'pest_prevention'
  | 'repotting'
  | 'general';

export type TaskNature = 'routine' | 'structural';

export type TaskTiming = 'overdue' | 'today' | 'this_week' | 'this_month' | 'upcoming';

export interface PersistentTask {
  id: string;
  userId: string;
  plantId: string;
  plantName: string;
  task: string;
  reason: string;
  category: TaskCategory;
  taskNature: TaskNature;
  scheduledMonth: number | null;
  windowStart: string | null; // ISO date string
  windowEnd: string | null;   // ISO date string
  priority: 'urgent' | 'normal' | 'low';
  status: 'pending' | 'completed' | 'skipped';
  completedAt: string | null;
  weatherAtCompletion: WeatherInfo | null;
  userNotes: string | null;
  language: string;
  generationBatch: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DisplayTask extends PersistentTask {
  timing: TaskTiming;
}

export interface CalendarEntry {
  id: string;
  plantId: string;
  plantName: string;
  task: string;
  category: TaskCategory;
  windowStart: string | null;
  windowEnd: string | null;
  scheduledMonth: number | null;
  status: 'pending' | 'completed' | 'skipped';
  priority: 'urgent' | 'normal' | 'low';
}

export interface AdaptationLog {
  id: string;
  userId: string;
  adaptedAt: string;
  adaptationPeriod: number;
  yearAdapted: number;
  weatherContext: WeatherInfo | null;
  tasksAdded: number;
  tasksModified: number;
}

export interface Coords {
  latitude: number;
  longitude: number;
}

export interface WeatherForecast {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
    precipitation_sum: number[];
  }
}

export interface WeatherInfo {
  temperature: number;
  condition: string;
  weatherCode: number;
  forecast?: WeatherForecast;
}

// Legacy type kept for backward compatibility during migration
export interface CareTask {
  plantName: string;
  task: string;
  reason: string;
  timing: 'Overdue' | 'Today' | 'This Week';
  category?: 'pruning' | 'grafting' | 'watering' | 'general';
}
