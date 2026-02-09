// FIX: Implemented the HomeScreen component which was previously a placeholder.
import React, { useMemo } from 'react';
import { useCareplan } from '../hooks/useCareplan';
import { useCompletedTasks } from '../hooks/useCompletedTasks';
import { useTranslation } from '../hooks/useTranslation';
import { Spinner } from '../components/Spinner';
import { CareTask } from '../types';
import { useGarden } from '../hooks/useGarden';
import { useAuth } from '../contexts/AuthContext';

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

    const getCategoryIcon = (category?: CareTask['category']) => {
        switch (category) {
            case 'pruning':
                return { icon: 'fa-scissors', color: 'text-purple-500' };
            case 'grafting':
                return { icon: 'fa-code-branch', color: 'text-orange-500' };
            case 'watering':
                return { icon: 'fa-droplet', color: 'text-blue-500' };
            default:
                return { icon: 'fa-leaf', color: 'text-green-500' };
        }
    }

    const timingInfo = getTimingInfo(task.timing);
    const catInfo = getCategoryIcon(task.category);

    return (
        <div
            onClick={() => toggleTaskCompletion(taskId)}
            className={`flex items-start p-5 rounded-3xl cursor-pointer transition-all duration-300 border ${isCompleted
                ? 'bg-gray-50 border-gray-100 text-gray-400 opacity-60'
                : 'bg-white border-gray-100 hover:border-garden-green/30 hover:shadow-xl hover:shadow-garden-green/5'
                }`}
        >
            <div className={`mr-4 mt-1 flex-shrink-0 w-8 h-8 rounded-2xl border-2 flex items-center justify-center transition-all ${isCompleted
                ? 'bg-garden-green border-garden-green'
                : 'border-gray-200 group-hover:border-garden-green'
                }`}>
                {isCompleted ? (
                    <i className="fa-solid fa-check text-white text-sm"></i>
                ) : (
                    <i className={`fa-solid ${catInfo.icon} ${catInfo.color} text-sm opacity-60`}></i>
                )}
            </div>
            <div className="flex-grow">
                <p className={`font-bold text-lg ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    {task.task}
                </p>
                <div className="flex items-center mt-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-garden-green/70 mr-2">{task.plantName}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full mr-2"></span>
                    <p className={`text-sm ${isCompleted ? 'line-through text-gray-400' : 'text-gray-500'}`}>{task.reason}</p>
                </div>
            </div>
            {!isCompleted && (
                <span className={`ml-2 px-3 py-1 text-[10px] font-black uppercase tracking-tighter rounded-xl whitespace-nowrap ${timingInfo.textColor} ${timingInfo.bgColor} border border-black/5 shadow-sm`}>
                    {timingInfo.label}
                </span>
            )}
        </div>
    );
};

export const HomeScreen: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { plants, isLoaded: isGardenLoaded } = useGarden();
    const { tasks, isLoading, error } = useCareplan();

    const adviceTasks = useMemo(() => {
        return tasks.filter(t => t.category === 'pruning' || t.category === 'grafting');
    }, [tasks]);

    const otherTasks = useMemo(() => {
        const timingOrder: { [key in CareTask['timing']]: number } = { 'Overdue': 1, 'Today': 2, 'This Week': 3 };
        return tasks
            .filter(t => t.category !== 'pruning' && t.category !== 'grafting')
            .sort((a, b) => timingOrder[a.timing] - timingOrder[b.timing]);
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
        <div className="p-6 pb-24 font-outfit">
            <div className="mb-10 pt-4">
                <h1 className="text-5xl font-black text-gray-900 tracking-tight leading-tight">
                    {t('welcomeTitle')}, <span className="highlight-yellow inline-block">{user?.email?.split('@')[0]}</span>
                </h1>
                <p className="text-gray-500 mt-2 text-lg font-medium tracking-wide italic decoration-garden-yellow underline decoration-2 underline-offset-4">{t('welcomeMessage')}</p>
            </div>

            {hasPlants && <WeatherDisplay />}

            {adviceTasks.length > 0 && (
                <div className="mb-10 animate-fade-in group">
                    <div className="bg-garden-green rounded-t-3xl p-5 flex items-center space-x-3 border-b-4 border-garden-yellow">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <i className="fa-solid fa-wand-magic-sparkles text-white text-xl"></i>
                        </div>
                        <h2 className="text-xl font-bold text-white uppercase tracking-widest">{t('botanicaAdvisor')}</h2>
                    </div>
                    <div className="bg-white rounded-b-3xl p-4 shadow-2xl shadow-garden-green/5 border-x border-b border-gray-100">
                        <div className="space-y-4">
                            {adviceTasks.map((task, index) => (
                                <TaskItem key={`advice-${task.plantName}-${task.task}-${index}`} task={task} />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{t('upcomingTasks')}</h2>
                <div className="h-1 flex-grow mx-4 bg-gray-100 rounded-full"></div>
            </div>

            {otherTasks.length > 0 || adviceTasks.length > 0 ? (
                <div className="space-y-4">
                    {otherTasks.map((task, index) => (
                        <TaskItem key={`${task.plantName}-${task.task}-${index}`} task={task} />
                    ))}
                </div>
            ) : (
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