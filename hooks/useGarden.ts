import { useState, useEffect, useCallback } from 'react';
import { Plant, StructuredCarePlan } from '../types';
import { supabaseService } from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';

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

  const addPlant = useCallback(async (plantData: { name: string; description: string; careNeeds: string; imageUrl: string; latitude?: number; longitude?: number; }): Promise<string | undefined> => {
    if (!user) return undefined;

    const newPlant: any = {
      name: plantData.name,
      description: plantData.description,
      careNeeds: plantData.careNeeds,
      imageUrl: plantData.imageUrl,
      latitude: plantData.latitude,
      longitude: plantData.longitude,
      notes: '',
    };

    const plantId = await supabaseService.addPlant(newPlant, user.id);
    await loadGarden();
    return plantId;
  }, [user, loadGarden]);

  const removePlant = useCallback(async (plantId: string) => {
    if (!user) return;
    // Delete all tasks for this plant first
    await supabaseService.deleteTasksForPlant(plantId, user.id);
    await supabaseService.deletePlant(plantId, user.id);
    await loadGarden();
  }, [user, loadGarden]);

  const updatePlantNotes = useCallback(async (plantId: string, notes: string) => {
    if (!user) return;
    await supabaseService.updatePlantNotes(plantId, user.id, notes);
    await loadGarden();
  }, [user, loadGarden]);

  const updatePlantDetails = useCallback(async (plantId: string, updates: Partial<Plant>) => {
    if (!user) return;
    try {
      await supabaseService.requestCarePlanRegeneration(plantId, user.id);
      await loadGarden();
    } catch (error) {
      console.error("Failed to update plant details:", error);
      throw error;
    }
  }, [user, loadGarden]);

  const regenerateCarePlan = useCallback(async (plantId: string) => {
    if (!user) return;
    try {
      await supabaseService.requestCarePlanRegeneration(plantId, user.id);
      await loadGarden();
    } catch (error) {
      console.error("Failed to request care plan regeneration:", error);
      throw error;
    }
  }, [user, loadGarden]);

  const cacheCarePlan = useCallback(async (plantId: string, carePlan: StructuredCarePlan) => {
    if (!user) return;
    try {
      await supabaseService.cacheCarePlan(plantId, user.id, carePlan);
      await loadGarden();
    } catch (error) {
      console.error("Failed to cache care plan:", error);
      throw error;
    }
  }, [user, loadGarden]);

  const updatePlantImage = useCallback(async (plantId: string, imageUrl: string) => {
    if (!user) return;
    await supabaseService.updatePlantImage(plantId, user.id, imageUrl);
    await loadGarden();
  }, [user, loadGarden]);

  const plantExists = useCallback((plantName: string): boolean => {
    return plants.some(p => p.name.toLowerCase() === plantName.toLowerCase());
  }, [plants]);

  return { 
    plants, 
    isLoaded, 
    addPlant, 
    removePlant, 
    updatePlantNotes, 
    updatePlantImage, 
    updatePlantDetails,
    regenerateCarePlan,
    cacheCarePlan,
    plantExists, 
    refreshGarden: loadGarden 
  };
};
