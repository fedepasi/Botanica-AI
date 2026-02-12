import { PlantNote, CreatePlantNoteInput, UpdatePlantNoteInput, NoteCategory, GroupedPlantNotes } from '../types';
import { supabase } from './supabase';

const TABLE_NAME = 'botanica_plant_notes';

// ===========================================
// CRUD Operations
// ===========================================

export const createPlantNote = async (input: CreatePlantNoteInput): Promise<PlantNote> => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert({
      plant_id: input.plantId,
      user_id: userData.user.id,
      content: input.content,
      title: input.title || null,
      category: input.category || 'general',
      tags: input.tags || [],
      entry_date: input.entryDate || new Date().toISOString().split('T')[0],
      entry_time: input.entryTime || null,
      is_pinned: input.isPinned || false,
      weather_context: input.weatherContext || null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapDbNoteToPlantNote(data);
};

export const updatePlantNote = async (noteId: string, input: UpdatePlantNoteInput): Promise<PlantNote> => {
  const updateData: Record<string, any> = {};
  
  if (input.content !== undefined) updateData.content = input.content;
  if (input.title !== undefined) updateData.title = input.title || null;
  if (input.category !== undefined) updateData.category = input.category;
  if (input.tags !== undefined) updateData.tags = input.tags;
  if (input.entryDate !== undefined) updateData.entry_date = input.entryDate;
  if (input.entryTime !== undefined) updateData.entry_time = input.entryTime || null;
  if (input.isPinned !== undefined) updateData.is_pinned = input.isPinned;
  if (input.isArchived !== undefined) updateData.is_archived = input.isArchived;

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(updateData)
    .eq('id', noteId)
    .select()
    .single();

  if (error) throw error;
  return mapDbNoteToPlantNote(data);
};

export const deletePlantNote = async (noteId: string): Promise<void> => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', noteId);

  if (error) throw error;
};

export const archivePlantNote = async (noteId: string): Promise<void> => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .update({ is_archived: true })
    .eq('id', noteId);

  if (error) throw error;
};

export const unarchivePlantNote = async (noteId: string): Promise<void> => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .update({ is_archived: false })
    .eq('id', noteId);

  if (error) throw error;
};

export const togglePinNote = async (noteId: string, isPinned: boolean): Promise<void> => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .update({ is_pinned: isPinned })
    .eq('id', noteId);

  if (error) throw error;
};

// ===========================================
// Query Operations
// ===========================================

export const getPlantNotes = async (plantId: string, options?: { 
  limit?: number;
  includeArchived?: boolean;
}): Promise<PlantNote[]> => {
  let query = supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('plant_id', plantId)
    .order('is_pinned', { ascending: false })
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (!options?.includeArchived) {
    query = query.eq('is_archived', false);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []).map(mapDbNoteToPlantNote);
};

export const getPlantNotesByCategory = async (
  plantId: string, 
  category: NoteCategory
): Promise<PlantNote[]> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('plant_id', plantId)
    .eq('category', category)
    .eq('is_archived', false)
    .order('entry_date', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapDbNoteToPlantNote);
};

export const searchPlantNotes = async (
  plantId: string,
  searchTerm: string
): Promise<PlantNote[]> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('plant_id', plantId)
    .eq('is_archived', false)
    .ilike('content', `%${searchTerm}%`)
    .order('entry_date', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapDbNoteToPlantNote);
};

export const getPlantNotesByTag = async (
  plantId: string,
  tag: string
): Promise<PlantNote[]> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('plant_id', plantId)
    .eq('is_archived', false)
    .contains('tags', [tag])
    .order('entry_date', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapDbNoteToPlantNote);
};

// ===========================================
// Grouping Helpers
// ===========================================

export const getGroupedPlantNotes = async (plantId: string): Promise<GroupedPlantNotes> => {
  const notes = await getPlantNotes(plantId);
  
  const today = new Date().toISOString().split('T')[0];
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return {
    pinned: notes.filter(n => n.isPinned),
    today: notes.filter(n => !n.isPinned && n.entryDate === today),
    thisWeek: notes.filter(n => !n.isPinned && n.entryDate >= oneWeekAgo && n.entryDate < today),
    thisMonth: notes.filter(n => !n.isPinned && n.entryDate >= oneMonthAgo && n.entryDate < oneWeekAgo),
    older: notes.filter(n => !n.isPinned && n.entryDate < oneMonthAgo),
  };
};

// ===========================================
// Migration Helper
// ===========================================

/**
 * Migrate legacy plant.notes (string) to the new plant_notes table
 * Call this when opening PlantDetailScreen for plants with legacy notes
 */
export const migrateLegacyNotes = async (plant: { 
  id: string; 
  notes?: string | null;
  created_at?: string;
}): Promise<void> => {
  if (!plant.notes || plant.notes.trim() === '') return;

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;

  // Check if already migrated (avoid duplicates)
  const { data: existing } = await supabase
    .from(TABLE_NAME)
    .select('id')
    .eq('plant_id', plant.id)
    .eq('content', plant.notes.trim())
    .limit(1);

  if (existing && existing.length > 0) return;

  // Create note from legacy content
  await createPlantNote({
    plantId: plant.id,
    content: plant.notes.trim(),
    title: 'Note legacy',
    category: 'general',
    entryDate: plant.created_at ? plant.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    tags: ['migrated'],
  });
};

// ===========================================
// Mapper
// ===========================================

interface DbPlantNote {
  id: string;
  plant_id: string;
  user_id: string;
  content: string;
  title: string | null;
  category: NoteCategory;
  tags: string[];
  entry_date: string;
  entry_time: string | null;
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
  is_archived: boolean;
  weather_context: {
    temperature?: number;
    condition?: string;
    note?: string;
  } | null;
  attachments: Array<{
    type: 'image' | 'audio' | 'document';
    url: string;
    caption?: string;
  }> | null;
}

const mapDbNoteToPlantNote = (db: DbPlantNote): PlantNote => ({
  id: db.id,
  plantId: db.plant_id,
  userId: db.user_id,
  content: db.content,
  title: db.title || undefined,
  category: db.category,
  tags: db.tags || [],
  entryDate: db.entry_date,
  entryTime: db.entry_time || undefined,
  createdAt: db.created_at,
  updatedAt: db.updated_at,
  isPinned: db.is_pinned,
  isArchived: db.is_archived,
  weatherContext: db.weather_context || undefined,
  attachments: db.attachments || undefined,
});

// ===========================================
// Category Labels (i18n ready)
// ===========================================

export const getCategoryLabel = (category: NoteCategory, language: 'en' | 'it' = 'it'): string => {
  const labels: Record<NoteCategory, { en: string; it: string }> = {
    general: { en: 'General', it: 'Generale' },
    planting: { en: 'Planting', it: 'Piantumazione' },
    pruning: { en: 'Pruning', it: 'Potatura' },
    fertilizing: { en: 'Fertilizing', it: 'Concimazione' },
    pest: { en: 'Pest Control', it: 'Parassiti' },
    observation: { en: 'Observation', it: 'Osservazione' },
    harvest: { en: 'Harvest', it: 'Raccolta' },
    transplant: { en: 'Transplant', it: 'Trapianto' },
    other: { en: 'Other', it: 'Altro' },
  };
  return labels[category][language];
};

export const getCategoryIcon = (category: NoteCategory): string => {
  const icons: Record<NoteCategory, string> = {
    general: '📝',
    planting: '🌱',
    pruning: '✂️',
    fertilizing: '🧪',
    pest: '🐛',
    observation: '👁️',
    harvest: '🍎',
    transplant: '🪴',
    other: '📌',
  };
  return icons[category];
};

export const getCategoryColor = (category: NoteCategory): string => {
  const colors: Record<NoteCategory, string> = {
    general: 'bg-gray-100 text-gray-700',
    planting: 'bg-green-100 text-green-700',
    pruning: 'bg-purple-100 text-purple-700',
    fertilizing: 'bg-blue-100 text-blue-700',
    pest: 'bg-red-100 text-red-700',
    observation: 'bg-yellow-100 text-yellow-700',
    harvest: 'bg-orange-100 text-orange-700',
    transplant: 'bg-amber-100 text-amber-700',
    other: 'bg-slate-100 text-slate-700',
  };
  return colors[category];
};

// All categories for UI dropdowns
export const ALL_NOTE_CATEGORIES: NoteCategory[] = [
  'general',
  'planting',
  'pruning',
  'fertilizing',
  'pest',
  'observation',
  'harvest',
  'transplant',
  'other',
];
