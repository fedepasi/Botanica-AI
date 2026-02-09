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
            imageUrl: p.image_url,
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
        if (error) throw error;
        return data;
    },

    async getPublicImageUrl(path: string) {
        const { data } = supabase.storage
            .from(getPrefixedBucketName('images'))
            .getPublicUrl(path);
        return data.publicUrl;
    }
};
