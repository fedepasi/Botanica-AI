import { supabase } from './supabaseClient';

const TABLE_PREFIX = 'botanica_';
const BUCKET_PREFIX = 'botanica_';

export const getPrefixedTableName = (tableName: string) => `${TABLE_PREFIX}${tableName}`;
export const getPrefixedBucketName = (bucketName: string) => `${BUCKET_PREFIX}${bucketName}`;

export const supabaseService = {
    // Database helpers
    async getPlants() {
        const { data, error } = await supabase
            .from(getPrefixedTableName('plants'))
            .select('*');
        if (error) throw error;
        return data;
    },

    async addPlant(plant: any) {
        const { data, error } = await supabase
            .from(getPrefixedTableName('plants'))
            .insert([plant]);
        if (error) throw error;
        return data;
    },

    // Storage helpers
    async uploadPlantImage(file: File | Blob, fileName: string) {
        const { data, error } = await supabase.storage
            .from(getPrefixedBucketName('images'))
            .upload(`${fileName}`, file);
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
