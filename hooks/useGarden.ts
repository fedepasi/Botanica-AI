import { useState, useEffect, useCallback } from 'react';
import { Plant } from '../types';
import { supabaseService } from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';

export const useGarden = () => {
  const { user } = useAuth();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadGarden = useCallback(async () => {
    if (!user) {
      setPlants([]);
      setIsLoaded(true);
      return;
    }

    try {
      const data = await supabaseService.getPlants(user.id);
      // Data from Supabase already contains imageUrl (which should be the public URL or partial path)
      setPlants(data || []);
    } catch (error) {
      console.error("Failed to load garden from Supabase", error);
    } finally {
      setIsLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    loadGarden();
  }, [loadGarden]);

  const addPlant = useCallback(async (plantData: { name: string; description: string; careNeeds: string; imageUrl: string; latitude?: number; longitude?: number; }) => {
    if (!user) return;

    // Handle image upload if it's a blob/base64 (AddPlantScreen might pass a temporary URL)
    // For now, assume AddPlantScreen handles the upload and passes the URL, 
    // OR we handle it here. To keep useGarden clean, let's assume AddPlantScreen 
    // provides a final URL or we handle the logic in AddPlantScreen.

    const newPlant: any = {
      name: plantData.name,
      description: plantData.description,
      careNeeds: plantData.careNeeds,
      imageUrl: plantData.imageUrl,
      latitude: plantData.latitude,
      longitude: plantData.longitude,
      notes: '',
    };

    await supabaseService.addPlant(newPlant, user.id);
    await loadGarden();
  }, [user, loadGarden]);

  const removePlant = useCallback(async (plantId: string) => {
    if (!user) return;
    await supabaseService.deletePlant(plantId, user.id);
    await loadGarden();
  }, [user, loadGarden]);

  const updatePlantNotes = useCallback(async (plantId: string, notes: string) => {
    // Note: Update logic needs to be added to supabaseService
    if (!user) return;
    // For now, simplicity: we'll implement update in service later if needed, 
    // or just refresh here after local update if we had a proper update method.
    console.warn("Update plant notes not yet fully implemented in Supabase service");
  }, [user]);

  const plantExists = useCallback((plantName: string): boolean => {
    return plants.some(p => p.name.toLowerCase() === plantName.toLowerCase());
  }, [plants]);

  return { plants, isLoaded, addPlant, removePlant, updatePlantNotes, plantExists, refreshGarden: loadGarden };
};
