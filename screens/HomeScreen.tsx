// FIX: Implemented the HomeScreen component which was previously a placeholder.
import React, { useMemo } from 'react';
import { useCareplan } from '../hooks/useCareplan';
import { useCompletedTasks } from '../hooks/useCompletedTasks';
import { useTranslation } from '../hooks/useTranslation';
import { Spinner } from '../components/Spinner';
import { CareTask } from '../types';
import { useGarden } from '../hooks/useGarden';

const WeatherDisplay: React.FC = () => {
    const { weather } = useCareplan();
    const { t } = useTranslation();

    if (!weather) return null;
    
    const getIconClass = (code: number): string => {
        if ([0, 1].includes(code)) return 'fa-sun'; // Clear
        if ([2].includes(code)) return 'fa-cloud-sun'; // Partly cloudy
        if ([3].includes(code)) return 'fa-cloud'; // Overcast
        if ([45, 48].includes(code)) return 'fa-smog'; // Fog
        if (code >= 51 && code <= 67) return 'fa-cloud-rain'; // Rain/Drizzle
        if (code >= 71 && code <= 77) return 'fa-snowflake'; // Snow
        if (code >= 80 && code <= 82) return 'fa-cloud-showers-heavy'; // Showers
        if (code >= 95 && code <= 99) return 'fa-bolt'; // Thunderstorm
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

const TaskItem: React.FC<{ task: CareTask }> = ({ task }) => {
    const { toggleTaskCompletion, isTaskCompleted } = useCompletedTasks();
    const { t } = useTranslation();
    const taskId = `${task.plantName}-${task.task}`.replace(/\s+/g, '-');
    const isCompleted = isTaskCompleted(taskId);

    const getTimingInfo = (timing: CareTask['timing']) => {
        switch (timing) {
            case 'Overdue':
                return { label: t('timingOverdue'), textColor: 'text-red-800', bgColor: 'bg-red-100' };
            case 'Today':
                return { label: t('timingToday'), textColor: 'text-yellow-800', bgColor: 'bg-yellow-100' };
            case 'This Week':
                return { label: t('timingThisWeek'), textColor: 'text-blue-800', bgColor: 'bg-blue-100' };
            default:
                return { label: '', textColor: 'text-gray-800', bgColor: 'bg-gray-100' };
        }
    };

    const timingInfo = getTimingInfo(task.timing);
    
    return (
        <div 
            onClick={() => toggleTaskCompletion(taskId)}
            className={`flex items-start p-4 rounded-lg cursor-pointer transition-all duration-300 shadow-md ${isCompleted ? 'bg-green-100 text-gray-500' : 'bg-white hover:bg-gray-50'}`}
        >
            <div className={`mr-4 mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                {isCompleted && <i className="fa-solid fa-check text-white text-sm"></i>}
            </div>
            <div className="flex-grow">
                <p className={`font-semibold ${isCompleted ? 'line-through' : 'text-gray-800'}`}>{task.task}: {task.plantName}</p>
                <p className={`text-sm ${isCompleted ? 'line-through' : ''}`}>{task.reason}</p>
            </div>
            {!isCompleted && (
                 <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${timingInfo.textColor} ${timingInfo.bgColor}`}>
                    {timingInfo.label}
                </span>
            )}
        </div>
    );
};

export const HomeScreen: React.FC = () => {
    const { t } = useTranslation();
    const { plants, isLoaded: isGardenLoaded } = useGarden();
    const { tasks, isLoading, error } = useCareplan();

    const sortedTasks = useMemo(() => {
        const timingOrder: { [key in CareTask['timing']]: number } = { 'Overdue': 1, 'Today': 2, 'This Week': 3 };
        return [...tasks].sort((a, b) => timingOrder[a.timing] - timingOrder[b.timing]);
    }, [tasks]);

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
    
    return (
        <div className="p-4 pb-20">
            <h1 className="text-4xl font-bold text-green-800 mb-2">{t('welcomeTitle')}</h1>
            <p className="text-gray-500 mb-6">{t('welcomeMessage')}</p>
            
            {hasPlants && <WeatherDisplay />}

            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('upcomingTasks')}</h2>

            {sortedTasks.length > 0 ? (
                <div className="space-y-3">
                    {sortedTasks.map((task, index) => (
                        <TaskItem key={`${task.plantName}-${task.task}-${index}`} task={task} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 px-4 bg-white rounded-lg shadow-md">
                    <i className="fa-solid fa-mug-saucer text-6xl text-gray-300 mb-4"></i>
                    <h2 className="text-xl font-semibold text-gray-700">
                      {hasPlants ? t('noTasksToday') : t('noPlantsTitle')}
                    </h2>
                    <p className="text-gray-500 mt-2">
                      {hasPlants ? t('noTasksMessage') : t('noPlantsMessage')}
                    </p>
                </div>
            )}
        </div>
    );
};