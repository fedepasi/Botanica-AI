import React, { useMemo } from 'react';
import { useGarden } from '../hooks/useGarden';
import { Plant, PlantStatus } from '../types';
import { Spinner } from '../components/Spinner';
import { useTranslation } from '../hooks/useTranslation';
import { useCareplan } from '../hooks/useCareplan';
import { useCompletedTasks } from '../hooks/useCompletedTasks';


interface GardenScreenProps {
  onSelectPlant: (plant: Plant) => void;
  onAddPlant: () => void;
}

export const GardenScreen: React.FC<GardenScreenProps> = ({ onSelectPlant, onAddPlant }) => {
  const { plants, isLoaded } = useGarden();
  const { t } = useTranslation();
  const { tasks, isLoading: isCareplanLoading } = useCareplan();
  const { isTaskCompleted } = useCompletedTasks();

  const plantStatuses = useMemo(() => {
    const statuses: { [plantId: string]: PlantStatus } = {};
    if (isCareplanLoading || !tasks) return statuses;

    const pendingTasksByPlant = new Set<string>();
    
    tasks.forEach(task => {
        const taskId = `${task.plantName}-${task.task}`.replace(/\s+/g, '-');
        if (!isTaskCompleted(taskId)) {
            pendingTasksByPlant.add(task.plantName);
        }
    });

    plants.forEach(plant => {
        if (pendingTasksByPlant.has(plant.name)) {
            statuses[plant.id] = 'needs_attention';
        } else {
            statuses[plant.id] = 'healthy';
        }
    });

    return statuses;

  }, [tasks, plants, isCareplanLoading, isTaskCompleted]);

  if (!isLoaded) {
    return <Spinner text={t('loadingGarden')} />;
  }

  return (
    <div className="p-4 pb-20">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-green-800">{t('myGarden')}</h1>
      </div>

      {plants.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-lg shadow-md">
          <i className="fa-solid fa-leaf text-6xl text-gray-300 mb-4"></i>
          <h2 className="text-xl font-semibold text-gray-700">{t('gardenEmptyTitle')}</h2>
          <p className="text-gray-500 mt-2 mb-6">{t('gardenEmptyMessage')}</p>
          <button
            onClick={onAddPlant}
            className="bg-green-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-green-600 transition-colors"
          >
            {t('addFirstPlant')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {plants.map(plant => {
            const status = plantStatuses[plant.id];
            return (
              <div
                key={plant.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transform hover:-translate-y-1 transition-transform duration-200"
                onClick={() => onSelectPlant(plant)}
              >
                <img src={plant.imageUrl} alt={plant.name} className="w-full h-32 object-cover" />
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-md text-gray-800 truncate pr-2">{plant.name}</h3>
                    {status && (
                      <span
                        title={status === 'healthy' ? t('plantStatusHealthy') : t('plantStatusNeedsAttention')}
                        className={`w-3 h-3 rounded-full flex-shrink-0 ${status === 'healthy' ? 'bg-green-500' : 'bg-yellow-400'}`}
                      ></span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
            <div
                onClick={onAddPlant}
                className="bg-white border-2 border-dashed border-gray-300 rounded-lg cursor-pointer flex flex-col items-center justify-center p-3 text-gray-500 hover:bg-green-50 hover:border-green-400 hover:text-green-600 transition-colors duration-200"
                aria-label={t('addPlant')}
            >
                <i className="fa-solid fa-plus text-4xl"></i>
                <span className="mt-2 font-semibold text-center">{t('addAnotherPlant')}</span>
            </div>
        </div>
      )}
    </div>
  );
};