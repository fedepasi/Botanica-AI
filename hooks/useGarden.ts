import { useState, useEffect, useCallback } from 'react';
import { Plant } from '../types';
import { saveImage, getImage, deleteImage } from '../services/dbService';

const GARDEN_KEY = 'botanica_ai_garden';
const GARDEN_UPDATE_EVENT = 'botanica_ai_garden_update';

// This function will be called to update localStorage and notify all hook instances
const updateStorageAndNotify = (plants: Omit<Plant, 'imageUrl'>[]) => {
  localStorage.setItem(GARDEN_KEY, JSON.stringify(plants));
  window.dispatchEvent(new CustomEvent(GARDEN_UPDATE_EVENT));
};

export const useGarden = () => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // This effect loads the garden from storage and sets up a listener for updates
  useEffect(() => {
    const loadGarden = async () => {
      try {
        const stored = localStorage.getItem(GARDEN_KEY);
        const metadatas: Omit<Plant, 'imageUrl'>[] = stored ? JSON.parse(stored) : [];
        
        // Revoke old blob URLs before creating new ones to prevent memory leaks
        setPlants(currentPlants => {
            currentPlants.forEach(p => {
                if(p.imageUrl.startsWith('blob:')) URL.revokeObjectURL(p.imageUrl);
            });
            return []; // Return empty while we load
        });

        const plantsWithImages = await Promise.all(
          metadatas.map(async (plant) => {
            const imageBlob = await getImage(plant.id);
            const imageUrl = imageBlob ? URL.createObjectURL(imageBlob) : './placeholder.png';
            return { ...plant, imageUrl };
          })
        );
        setPlants(plantsWithImages);
      } catch (error) {
        console.error("Failed to load garden", error);
        setPlants([]);
      } finally {
        if (!isLoaded) setIsLoaded(true);
      }
    };

    loadGarden();

    // Type assertion for the event listener
    const eventListener = () => loadGarden();
    window.addEventListener(GARDEN_UPDATE_EVENT, eventListener);

    return () => {
      window.removeEventListener(GARDEN_UPDATE_EVENT, eventListener);
      // Final cleanup on unmount
      setPlants(currentPlants => {
        currentPlants.forEach(p => {
          if (p.imageUrl.startsWith('blob:')) {
            URL.revokeObjectURL(p.imageUrl);
          }
        });
        return [];
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // isLoaded dependency removed to prevent re-running, the event handles updates.

  const addPlant = useCallback(async (plantData: { name: string; description: string; careNeeds: string; imageUrl: string; }) => {
    const newPlant: Omit<Plant, 'imageUrl'> = {
      name: plantData.name,
      description: plantData.description,
      careNeeds: plantData.careNeeds,
      id: `plant_${Date.now()}`,
      notes: '',
    };
    
    await saveImage(newPlant.id, plantData.imageUrl);

    const stored = localStorage.getItem(GARDEN_KEY);
    const metadatas: Omit<Plant, 'imageUrl'>[] = stored ? JSON.parse(stored) : [];
    updateStorageAndNotify([...metadatas, newPlant]);
  }, []);

  const removePlant = useCallback(async (plantId: string) => {
    await deleteImage(plantId);
    
    const stored = localStorage.getItem(GARDEN_KEY);
    const metadatas: Omit<Plant, 'imageUrl'>[] = stored ? JSON.parse(stored) : [];
    const newMetadatas = metadatas.filter(p => p.id !== plantId);
    updateStorageAndNotify(newMetadatas);
  }, []);

  const updatePlantNotes = useCallback((plantId: string, notes: string) => {
    const stored = localStorage.getItem(GARDEN_KEY);
    const metadatas: Omit<Plant, 'imageUrl'>[] = stored ? JSON.parse(stored) : [];
    const newMetadatas = metadatas.map(p => p.id === plantId ? { ...p, notes } : p);
    updateStorageAndNotify(newMetadatas);
  }, []);

  const plantExists = useCallback((plantName: string): boolean => {
    return plants.some(p => p.name.toLowerCase() === plantName.toLowerCase());
  }, [plants]);

  return { plants, isLoaded, addPlant, removePlant, updatePlantNotes, plantExists };
};
