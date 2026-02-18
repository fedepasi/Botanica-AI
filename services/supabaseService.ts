import { supabase } from './supabaseClient';
import { PersistentTask, WeatherInfo, StructuredCarePlan } from '../types';

const TABLE_PREFIX = 'botanica_';
const BUCKET_PREFIX = 'botanica_';

export const getPrefixedTableName = (tableName: string) => `${TABLE_PREFIX}${tableName}`;
export const getPrefixedBucketName = (bucketName: string) => `${BUCKET_PREFIX}${bucketName}`;

// Map a DB row to PersistentTask
const mapRowToTask = (row: any): PersistentTask => ({
    id: row.id,
    userId: row.user_id,
    plantId: row.plant_id,
    plantName: row.plant_name,
    task: row.task,
    reason: row.reason || '',
    category: row.category || 'general',
    taskNature: row.task_nature || 'routine',
    scheduledMonth: row.scheduled_month,
    windowStart: row.window_start,
    windowEnd: row.window_end,
    priority: row.priority || 'normal',
    status: row.status || 'pending',
    completedAt: row.completed_at,
    weatherAtCompletion: row.weather_at_completion,
    userNotes: row.user_notes,
    language: row.language || 'en',
    generationBatch: row.generation_batch,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

export const supabaseService = {
    // ========================================
    // Plant Management
    // ========================================
    async getPlants(userId: string) {
        const { data, error } = await supabase
            .from(getPrefixedTableName('plants'))
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) throw error;

        return (data || []).map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            careNeeds: p.care_needs,
            imageUrl: typeof p.image_url === 'string' && p.image_url.length > 2 ? p.image_url : '',
            notes: p.notes,
            latitude: p.latitude,
            longitude: p.longitude,
            // Cache piano di cura (Task #24)
            cachedCarePlan: p.cached_care_plan,
            carePlanGeneratedAt: p.care_plan_generated_at,
            carePlanNeedsRegeneration: p.care_plan_needs_regeneration,
        }));
    },

    async addPlant(plant: any, userId: string): Promise<string> {
        const dbPlant = {
            name: plant.name,
            description: plant.description,
            care_needs: plant.careNeeds,
            image_url: plant.imageUrl,
            latitude: plant.latitude,
            longitude: plant.longitude,
            user_id: userId,
            notes: plant.notes || ''
        };
        const { data, error } = await supabase
            .from(getPrefixedTableName('plants'))
            .insert([dbPlant])
            .select('id')
            .single();
        if (error) throw error;
        return data.id;
    },

    async updatePlantImage(plantId: string, userId: string, imageUrl: string) {
        const { error } = await supabase
            .from(getPrefixedTableName('plants'))
            .update({ image_url: imageUrl })
            .eq('id', plantId)
            .eq('user_id', userId);
        if (error) throw error;
    },

    async updatePlantNotes(plantId: string, userId: string, notes: string) {
        const { error } = await supabase
            .from(getPrefixedTableName('plants'))
            .update({ notes })
            .eq('id', plantId)
            .eq('user_id', userId);
        if (error) throw error;
    },

    async deletePlant(plantId: string, userId: string) {
        const { error } = await supabase
            .from(getPrefixedTableName('plants'))
            .delete()
            .eq('id', plantId)
            .eq('user_id', userId);
        if (error) throw error;
    },

    // ========================================
    // Storage
    // ========================================
    async uploadPlantImage(file: File | Blob, fileName: string, userId: string) {
        const path = `${userId}/${fileName}`;
        const { data, error } = await supabase.storage
            .from(getPrefixedBucketName('images'))
            .upload(path, file);

        if (error) {
            if (error.message.includes('not found')) {
                throw new Error(`Storage Bucket 'botanica_images' not found. Please create a public bucket named 'botanica_images' in your Supabase dashboard.`);
            }
            throw error;
        }
        return data;
    },

    getPublicImageUrl(path: string): string {
        const { data } = supabase.storage
            .from(getPrefixedBucketName('images'))
            .getPublicUrl(path);
        return data.publicUrl;
    },

    // ========================================
    // User Preferences
    // ========================================
    async getLanguagePreference(userId: string): Promise<string | null> {
        const { data, error } = await supabase
            .from(getPrefixedTableName('user_preferences'))
            .select('language')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) throw error;
        return data?.language ?? null;
    },

    async saveLanguagePreference(userId: string, language: string) {
        const { error } = await supabase
            .from(getPrefixedTableName('user_preferences'))
            .upsert({ user_id: userId, language }, { onConflict: 'user_id' });

        if (error) throw error;
    },

    // ========================================
    // Persistent Tasks - CRUD
    // ========================================
    async getTasksForUser(
        userId: string,
        filters?: { status?: string; plantId?: string; month?: number; nature?: string }
    ): Promise<PersistentTask[]> {
        let query = supabase
            .from(getPrefixedTableName('tasks'))
            .select('*')
            .eq('user_id', userId)
            .order('window_start', { ascending: true, nullsFirst: false });

        if (filters?.status) query = query.eq('status', filters.status);
        if (filters?.plantId) query = query.eq('plant_id', filters.plantId);
        if (filters?.month) query = query.eq('scheduled_month', filters.month);
        if (filters?.nature) query = query.eq('task_nature', filters.nature);

        const { data, error } = await query;
        if (error) throw error;
        return (data || []).map(mapRowToTask);
    },

    async getTasksForPlant(userId: string, plantId: string): Promise<PersistentTask[]> {
        const { data, error } = await supabase
            .from(getPrefixedTableName('tasks'))
            .select('*')
            .eq('user_id', userId)
            .eq('plant_id', plantId)
            .order('window_start', { ascending: true, nullsFirst: false });

        if (error) throw error;
        return (data || []).map(mapRowToTask);
    },

    async createTasks(
        userId: string,
        plantId: string,
        plantName: string,
        tasks: Array<{
            task: string;
            reason: string;
            category: string;
            taskNature: string;
            scheduledMonth?: number;
            windowStart?: string;
            windowEnd?: string;
            priority?: string;
        }>,
        language: string,
        batchId: string
    ): Promise<void> {
        if (tasks.length === 0) return;

        const rows = tasks.map(t => ({
            user_id: userId,
            plant_id: plantId,
            plant_name: plantName,
            task: t.task,
            reason: t.reason || '',
            category: t.category || 'general',
            task_nature: t.taskNature || 'routine',
            scheduled_month: t.scheduledMonth || null,
            window_start: t.windowStart || null,
            window_end: t.windowEnd || null,
            priority: t.priority || 'normal',
            status: 'pending',
            language,
            generation_batch: batchId,
        }));

        const { error } = await supabase
            .from(getPrefixedTableName('tasks'))
            .insert(rows);
        if (error) throw error;
    },

    async completeTask(
        taskId: string,
        userId: string,
        weather?: WeatherInfo | null,
        notes?: string
    ): Promise<void> {
        const update: any = {
            status: 'completed',
            completed_at: new Date().toISOString(),
        };
        if (weather) update.weather_at_completion = weather;
        if (notes !== undefined) update.user_notes = notes;

        const { error } = await supabase
            .from(getPrefixedTableName('tasks'))
            .update(update)
            .eq('id', taskId)
            .eq('user_id', userId);
        if (error) throw error;
    },

    async uncompleteTask(taskId: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from(getPrefixedTableName('tasks'))
            .update({
                status: 'pending',
                completed_at: null,
                weather_at_completion: null,
                user_notes: null,
            })
            .eq('id', taskId)
            .eq('user_id', userId);
        if (error) throw error;
    },

    async deleteTasksForPlant(plantId: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from(getPrefixedTableName('tasks'))
            .delete()
            .eq('plant_id', plantId)
            .eq('user_id', userId);
        if (error) throw error;
    },

    async hasTasksForPlant(plantId: string, userId: string): Promise<boolean> {
        const { count, error } = await supabase
            .from(getPrefixedTableName('tasks'))
            .select('id', { count: 'exact', head: true })
            .eq('plant_id', plantId)
            .eq('user_id', userId);
        if (error) throw error;
        return (count || 0) > 0;
    },

    async getCompletedTaskHistory(userId: string, months: number = 3): Promise<PersistentTask[]> {
        const since = new Date();
        since.setMonth(since.getMonth() - months);

        const { data, error } = await supabase
            .from(getPrefixedTableName('tasks'))
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .gte('completed_at', since.toISOString())
            .order('completed_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(mapRowToTask);
    },

    // ========================================
    // Adaptation Log
    // ========================================
    async getLastAdaptation(userId: string, year: number) {
        const { data, error } = await supabase
            .from(getPrefixedTableName('adaptation_log'))
            .select('*')
            .eq('user_id', userId)
            .eq('year_adapted', year)
            .order('adaptation_period', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    async shouldAdapt(userId: string): Promise<boolean> {
        const now = new Date();
        const year = now.getFullYear();
        const last = await this.getLastAdaptation(userId, year);
        if (!last) return true; // never adapted this year

        const lastDate = new Date(last.adapted_at);
        const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 15;
    },

    async recordAdaptation(
        userId: string,
        weather?: WeatherInfo | null,
        tasksAdded: number = 0,
        tasksModified: number = 0
    ): Promise<void> {
        const now = new Date();
        const year = now.getFullYear();
        const last = await this.getLastAdaptation(userId, year);
        const nextPeriod = last ? last.adaptation_period + 1 : 1;

        const { error } = await supabase
            .from(getPrefixedTableName('adaptation_log'))
            .insert({
                user_id: userId,
                adaptation_period: nextPeriod,
                year_adapted: year,
                weather_context: weather || null,
                tasks_added: tasksAdded,
                tasks_modified: tasksModified,
            });
        if (error) throw error;
    },

    // ========================================
    // Task Updates (for adaptation modifications)
    // ========================================
    async updateTaskWindow(
        taskId: string,
        userId: string,
        windowStart: string,
        windowEnd: string,
        priority?: string
    ): Promise<void> {
        const update: any = {
            window_start: windowStart,
            window_end: windowEnd,
        };
        if (priority) update.priority = priority;

        const { error } = await supabase
            .from(getPrefixedTableName('tasks'))
            .update(update)
            .eq('id', taskId)
            .eq('user_id', userId);
        if (error) throw error;
    },

    // ========================================
    // Legacy Careplan (kept for reference, not actively used)
    // ========================================
    async getCareplan(userId: string, date: string, plantCount: number, language: string) {
        const { data, error } = await supabase
            .from(getPrefixedTableName('careplans'))
            .select('tasks, weather')
            .eq('user_id', userId)
            .eq('generated_date', date)
            .eq('plant_count', plantCount)
            .eq('language', language)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    async saveCareplan(userId: string, tasks: any[], weather: any, plantCount: number, language: string) {
        const date = new Date().toISOString().split('T')[0];
        const { error } = await supabase
            .from(getPrefixedTableName('careplans'))
            .upsert({
                user_id: userId,
                generated_date: date,
                tasks,
                weather,
                plant_count: plantCount,
                language,
            }, { onConflict: 'user_id,generated_date' });

        if (error) throw error;
    },

    // ========================================
    // Care Plan Cache (Task #24)
    // ========================================
    
    /**
     * Salva il piano di cura in cache per una pianta
     */
    async cacheCarePlan(
        plantId: string,
        userId: string,
        carePlan: StructuredCarePlan,
        language?: string
    ): Promise<void> {
        // Embed language code into the cached plan so we can detect stale cache on language switch
        const planWithLanguage = language ? { ...carePlan, _language: language } : carePlan;
        const { error } = await supabase
            .from(getPrefixedTableName('plants'))
            .update({
                cached_care_plan: planWithLanguage,
                care_plan_generated_at: new Date().toISOString(),
                care_plan_needs_regeneration: false,
            })
            .eq('id', plantId)
            .eq('user_id', userId);
        
        if (error) throw error;
    },

    /**
     * Richiede la rigenerazione manuale del piano di cura
     */
    async requestCarePlanRegeneration(plantId: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from(getPrefixedTableName('plants'))
            .update({
                care_plan_needs_regeneration: true,
                cached_care_plan: null,
                care_plan_generated_at: null,
            })
            .eq('id', plantId)
            .eq('user_id', userId);
        
        if (error) throw error;
    },

    /**
     * Verifica se il piano di cura in cache è valido (non scaduto)
     * @returns Il piano di cura se valido, null altrimenti
     */
    async getCachedCarePlan(
        plantId: string,
        userId: string,
        maxAgeDays: number = 15
    ): Promise<StructuredCarePlan | null> {
        const { data, error } = await supabase
            .from(getPrefixedTableName('plants'))
            .select('cached_care_plan, care_plan_generated_at, care_plan_needs_regeneration')
            .eq('id', plantId)
            .eq('user_id', userId)
            .single();
        
        if (error || !data) return null;
        
        // Se richiesta rigenerazione manuale, invalida cache
        if (data.care_plan_needs_regeneration) {
            return null;
        }
        
        // Se non c'è piano in cache, ritorna null
        if (!data.cached_care_plan || !data.care_plan_generated_at) {
            return null;
        }
        
        // Verifica se il piano è scaduto
        const generatedAt = new Date(data.care_plan_generated_at);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - generatedAt.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays > maxAgeDays) {
            return null;
        }
        
        return data.cached_care_plan as StructuredCarePlan;
    },

    /**
     * Ottiene tutte le piante che necessitano rigenerazione del piano
     * (per cron job o batch processing)
     */
    async getPlantsNeedingCarePlanRegeneration(
        userId: string,
        maxAgeDays: number = 15,
        limit: number = 100
    ): Promise<Array<{ plantId: string; name: string; generatedAt: string | null }>> {
        const { data, error } = await supabase
            .from(getPrefixedTableName('plants'))
            .select('id, name, care_plan_generated_at')
            .eq('user_id', userId)
            .or(`care_plan_needs_regeneration.eq.true,care_plan_generated_at.is.null,care_plan_generated_at.lt.${new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000).toISOString()}`)
            .limit(limit);
        
        if (error) throw error;
        
        return (data || []).map(p => ({
            plantId: p.id,
            name: p.name,
            generatedAt: p.care_plan_generated_at,
        }));
    },
};
