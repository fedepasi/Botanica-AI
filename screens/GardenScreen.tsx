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
    <div className="p-6 pb-24 font-outfit">
      <div className="mb-10 pt-4 text-center">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">
          <span className="highlight-yellow inline-block px-2">{t('myGarden')}</span>
        </h1>
      </div>

      {plants.length === 0 ? (
        <div className="text-center py-20 px-8 bg-white border border-gray-100 rounded-[48px] shadow-sm">
          <div className="w-24 h-24 bg-garden-beige rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fa-solid fa-leaf text-5xl text-garden-green/30"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{t('gardenEmptyTitle')}</h2>
          <p className="text-gray-500 mt-2 mb-8 font-medium italic">{t('gardenEmptyMessage')}</p>
          <button
            onClick={onAddPlant}
            className="w-full bg-garden-green text-white font-black py-4 px-8 rounded-2xl shadow-lg shadow-garden-green/20 hover:scale-105 transition-all text-sm uppercase tracking-widest"
          >
            {t('addFirstPlant')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {plants.map(plant => {
            const status = plantStatuses[plant.id];
            return (
              <div
                key={plant.id}
                className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden cursor-pointer transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-garden-green/5 transition-all duration-300"
                onClick={() => onSelectPlant(plant)}
              >
                <div className="relative h-40">
                  <img src={plant.imageUrl} alt={plant.name} className="w-full h-full object-cover" />
                  {status && (
                    <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border border-white shadow-sm ${status === 'healthy' ? 'bg-garden-green text-white' : 'bg-garden-yellow text-gray-900'
                      }`}>
                      {status === 'healthy' ? t('plantStatusHealthy') : t('plantStatusNeedsAttention')}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 truncate tracking-tight">{plant.name}</h3>
                </div>
              </div>
            )
          })}
          <div
            onClick={onAddPlant}
            className="bg-garden-beige border-4 border-dashed border-garden-green/20 rounded-[32px] cursor-pointer flex flex-col items-center justify-center p-6 text-garden-green/40 hover:bg-garden-green/5 hover:border-garden-green/40 hover:text-garden-green transition-all group min-h-[180px]"
            aria-label={t('addPlant')}
          >
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-plus text-2xl"></i>
            </div>
            <span className="font-bold text-xs uppercase tracking-widest text-center">{t('addAnotherPlant')}</span>
          </div>
        </div>
      )}
    </div>
  );
};