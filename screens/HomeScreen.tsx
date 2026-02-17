import React from 'react';
import { useCareplan } from '../hooks/useCareplan';
import { useTranslation } from '../hooks/useTranslation';
import { useGroupedTasks } from '../hooks/useGroupedTasks';
import { Spinner } from '../components/Spinner';
import { UrgentBanner } from '../components/UrgentBanner';
import { WorkCategory } from '../components/WorkCategory';
import { useGarden } from '../hooks/useGarden';
import { useAuth } from '../contexts/AuthContext';

const WeatherDisplay: React.FC = () => {
  const { weather } = useCareplan();
  const { t } = useTranslation();

  if (!weather) return null;

  const getIconClass = (code: number): string => {
    if ([0, 1].includes(code)) return 'fa-sun';
    if ([2].includes(code)) return 'fa-cloud-sun';
    if ([3].includes(code)) return 'fa-cloud';
    if ([45, 48].includes(code)) return 'fa-smog';
    if (code >= 51 && code <= 67) return 'fa-cloud-rain';
    if (code >= 71 && code <= 77) return 'fa-snowflake';
    if (code >= 80 && code <= 82) return 'fa-cloud-showers-heavy';
    if (code >= 95 && code <= 99) return 'fa-bolt';
    return 'fa-question-circle';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6 text-center">
      <h2 className="text-xl font-semibold text-gray-700">{t('todayWeather')}</h2>
      <div className="flex items-center justify-center space-x-4 mt-3">
        <i className={`fa-solid ${getIconClass(weather.weatherCode)} text-5xl text-yellow-400`}></i>
        <div>
          <p className="text-4xl font-bold text-gray-800">{weather.temperature}°C</p>
          <p className="text-gray-500">{weather.condition}</p>
        </div>
      </div>
    </div>
  );
};

export const HomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { plants, isLoaded: isGardenLoaded } = useGarden();
  const { isLoading, isAdapting, error } = useCareplan();
  const {
    urgentTasks,
    groupedTasks,
    expandedCategories,
    toggleCategory,
    completedTasks,
    completeTask,
  } = useGroupedTasks(t);

  if (isLoading || !isGardenLoaded) {
    return <Spinner text={t('loadingDashboard')} />;
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
          <strong className="font-bold">{t('errorTitle')}</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      </div>
    );
  }

  const hasPlants = plants.length > 0;
  const totalPending = urgentTasks.length + groupedTasks.reduce((sum, g) => sum + g.totalTasks, 0);

  return (
    <div className="p-6 pb-24 font-outfit">
      {/* Welcome header */}
      <div className="mb-10 pt-4">
        <h1 className="text-5xl font-black text-gray-900 tracking-tight leading-tight">
          {t('welcomeTitle')} <span className="highlight-yellow inline-block">{user?.email?.split('@')[0]}</span>!
        </h1>
        <p className="text-gray-500 mt-2 text-lg font-medium tracking-wide italic decoration-garden-yellow underline decoration-2 underline-offset-4">
          {t('welcomeMessage')}
        </p>
      </div>

      {hasPlants && <WeatherDisplay />}

      {isAdapting && (
        <div className="mb-6 p-4 bg-garden-yellow/20 rounded-2xl flex items-center space-x-3 border border-garden-yellow/30">
          <i className="fa-solid fa-circle-notch animate-spin text-garden-green"></i>
          <span className="text-sm font-bold text-gray-700">{t('adaptingTasks')}</span>
        </div>
      )}

      {/* Urgent tasks banner */}
      <UrgentBanner tasks={urgentTasks} onComplete={completeTask} />

      {/* Category accordions */}
      {groupedTasks.length > 0 && (
        <div className="mb-8">
          {groupedTasks.map(group => (
            <WorkCategory
              key={group.category}
              group={group}
              isExpanded={expandedCategories.has(group.category)}
              onToggle={() => toggleCategory(group.category)}
              onComplete={completeTask}
            />
          ))}
        </div>
      )}

      {/* Recently completed */}
      {completedTasks.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-400 tracking-tight">{t('recentlyCompleted')}</h2>
            <div className="h-0.5 flex-grow mx-4 bg-gray-50 rounded-full"></div>
          </div>
          <div className="space-y-2">
            {completedTasks.map(task => (
              <div key={task.id} className="flex items-center p-4 rounded-2xl bg-gray-50/50 border border-gray-100 opacity-60">
                <div className="mr-3 w-6 h-6 rounded-xl bg-garden-green flex items-center justify-center flex-shrink-0">
                  <i className="fa-solid fa-check text-white text-xs"></i>
                </div>
                <div className="flex-grow">
                  <p className="font-bold text-sm text-gray-400 line-through">{task.task}</p>
                  <span className="text-xs text-gray-400">{task.plantName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {totalPending === 0 && completedTasks.length === 0 && (
        <div className="text-center py-16 px-6 bg-white border border-dashed border-gray-200 rounded-[40px] shadow-sm">
          <div className="w-24 h-24 bg-garden-beige rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fa-solid fa-mug-saucer text-5xl text-gray-300"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
            {hasPlants ? t('noTasksToday') : t('noPlantsTitle')}
          </h2>
          <p className="text-gray-500 mt-2 font-medium">
            {hasPlants ? t('noTasksMessage') : t('noPlantsMessage')}
          </p>
        </div>
      )}
    </div>
  );
};
