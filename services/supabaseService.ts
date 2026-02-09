import { supabase } from './supabaseClient';

const TABLE_PREFIX = 'botanica_';
const BUCKET_PREFIX = 'botanica_';

export const getPrefixedTableName = (tableName: string) => `${TABLE_PREFIX}${tableName}`;
export const getPrefixedBucketName = (bucketName: string) => `${BUCKET_PREFIX}${bucketName}`;

export const supabaseService = {
    // Database helpers
    async getPlants(userId: string) {
        const { data, error } = await supabase
            .from(getPrefixedTableName('plants'))
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) throw error;

        // Map database fields to frontend types
        return (data || []).map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            careNeeds: p.care_needs,
            imageUrl: typeof p.image_url === 'string' && p.image_url.length > 2 ? p.image_url : '',
            notes: p.notes,
            latitude: p.latitude,
            longitude: p.longitude,
        }));
    },

    async addPlant(plant: any, userId: string) {
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
            .insert([dbPlant]);
        if (error) throw error;
        return data;
    },

    async deletePlant(plantId: string, userId: string) {
        const { error } = await supabase
            .from(getPrefixedTableName('plants'))
            .delete()
            .eq('id', plantId)
            .eq('user_id', userId);
        if (error) throw error;
    },

    // Storage helpers
    async uploadPlantImage(file: File | Blob, fileName: string, userId: string) {
        // Path matches common practice: user_id/filename
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

    // User preferences
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

    // Careplan persistence
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
        return data; // null if no matching plan found
    },

    async saveCareplan(userId: string, tasks: any[], weather: any, plantCount: number, language: string) {
        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
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
};
