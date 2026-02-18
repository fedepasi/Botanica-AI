export interface Plant {
  id: string;
  name: string;
  description: string;
  careNeeds: string;
  imageUrl: string;
  notes: string;
  latitude?: number;
  longitude?: number;
  // Cache piano di cura (Task #24)
  cachedCarePlan?: StructuredCarePlan | null;
  carePlanGeneratedAt?: string | null;
  carePlanNeedsRegeneration?: boolean;
}

export interface Message {
  id: string;
  text: string;
  imageUrl?: string;
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

// ===========================================
// NEW: Structured Care Plan (Task #21)
// ===========================================

export interface CarePlanWatering {
  frequency: string;
  amount: string;
  technique?: string;
  seasonalNotes?: string;
}

export interface CarePlanSunlight {
  requirement: string;
  hoursPerDay?: string;
  placement?: string;
}

export interface CarePlanSoil {
  type: string;
  ph?: string;
  amendments?: string;
}

export interface CarePlanFertilizing {
  type: string;
  frequency: string;
  timing?: string;
}

export interface CarePlanPruning {
  timing?: string;
  technique?: string;
  frequency?: string;
}

export interface CarePlanTemperature {
  idealRange?: string;
  hardiness?: string;
  humidity?: string;
}

export interface CarePlanPests {
  common?: string;
  prevention?: string;
  treatment?: string;
}

export interface CarePlanRepotting {
  frequency?: string;
  timing?: string;
  potSize?: string;
}

export interface CarePlanHarvesting {
  timing?: string;
  technique?: string;
  storage?: string;
}

export interface StructuredCarePlan {
  watering: CarePlanWatering;
  sunlight: CarePlanSunlight;
  soil: CarePlanSoil;
  fertilizing?: CarePlanFertilizing;
  pruning?: CarePlanPruning;
  temperature?: CarePlanTemperature;
  pests?: CarePlanPests;
  repotting?: CarePlanRepotting;
  harvesting?: CarePlanHarvesting;
  warnings?: string[];
  tips?: string[];
  /** Language code used when generating this plan (e.g. 'it', 'en'). Used to detect stale cache on language switch. */
  _language?: string;
}

// Legacy care plan response (for backward compatibility)
export interface LegacyCarePlanResponse {
  markdown: string;
}

// New structured care plan response
export interface StructuredCarePlanResponse {
  structured: StructuredCarePlan;
  markdown?: string; // Optional: for backward compatibility
}

// ===========================================
// NEW: Plant Diary / Notes System (Task #23)
// ===========================================

export type NoteCategory = 
  | 'general'
  | 'planting'
  | 'pruning'
  | 'fertilizing'
  | 'pest'
  | 'observation'
  | 'harvest'
  | 'transplant'
  | 'other';

export interface PlantNote {
  id: string;
  plantId: string;
  userId: string;
  content: string;
  title?: string;
  category: NoteCategory;
  tags: string[];
  entryDate: string; // ISO date string (customizable - can be in the past)
  entryTime?: string; // Optional time
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  isArchived: boolean;
  weatherContext?: {
    temperature?: number;
    condition?: string;
    note?: string;
  };
  attachments?: Array<{
    type: 'image' | 'audio' | 'document';
    url: string;
    caption?: string;
  }>;
}

// For creating/updating notes
export interface CreatePlantNoteInput {
  plantId: string;
  content: string;
  title?: string;
  category?: NoteCategory;
  tags?: string[];
  entryDate?: string; // Custom date (defaults to today)
  entryTime?: string;
  isPinned?: boolean;
  weatherContext?: PlantNote['weatherContext'];
}

export interface UpdatePlantNoteInput {
  content?: string;
  title?: string;
  category?: NoteCategory;
  tags?: string[];
  entryDate?: string; // Can change the date
  entryTime?: string;
  isPinned?: boolean;
  isArchived?: boolean;
}

// Grouped notes for display
export interface GroupedPlantNotes {
  today: PlantNote[];
  thisWeek: PlantNote[];
  thisMonth: PlantNote[];
  older: PlantNote[];
  pinned: PlantNote[];
}

// Legacy field on Plant - to be migrated
// plant.notes (string) → plant_notes table entries
