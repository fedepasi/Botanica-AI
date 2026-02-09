import React, { useMemo, useState } from 'react';
import { useCareplan } from '../hooks/useCareplan';
import { useTranslation } from '../hooks/useTranslation';
import { Spinner } from '../components/Spinner';
import { DisplayTask, TaskCategory } from '../types';
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

const getCategoryIcon = (category?: TaskCategory) => {
    switch (category) {
        case 'pruning':
            return { icon: 'fa-scissors', color: 'text-purple-500' };
        case 'grafting':
            return { icon: 'fa-code-branch', color: 'text-orange-500' };
        case 'watering':
            return { icon: 'fa-droplet', color: 'text-blue-500' };
        case 'fertilizing':
            return { icon: 'fa-flask', color: 'text-green-600' };
        case 'harvesting':
            return { icon: 'fa-apple-whole', color: 'text-yellow-600' };
        case 'pest_prevention':
            return { icon: 'fa-shield-virus', color: 'text-red-500' };
        case 'seeding':
            return { icon: 'fa-seedling', color: 'text-green-400' };
        case 'repotting':
            return { icon: 'fa-bucket', color: 'text-amber-600' };
        default:
            return { icon: 'fa-leaf', color: 'text-green-500' };
    }
};

const TaskItem: React.FC<{ task: DisplayTask; onComplete: (id: string, notes?: string) => void }> = ({ task, onComplete }) => {
    const { t } = useTranslation();
    const [showNotes, setShowNotes] = useState(false);
    const [notes, setNotes] = useState('');

    const getTimingInfo = (timing: DisplayTask['timing']) => {
        switch (timing) {
            case 'overdue':
                return { label: t('timingOverdue'), textColor: 'text-red-800', bgColor: 'bg-red-100' };
            case 'today':
                return { label: t('timingToday'), textColor: 'text-yellow-800', bgColor: 'bg-yellow-100' };
            case 'this_week':
                return { label: t('timingThisWeek'), textColor: 'text-blue-800', bgColor: 'bg-blue-100' };
            case 'this_month':
                return { label: t('timingThisMonth'), textColor: 'text-indigo-800', bgColor: 'bg-indigo-100' };
            default:
                return { label: t('timingUpcoming'), textColor: 'text-gray-800', bgColor: 'bg-gray-100' };
        }
    };

    const timingInfo = getTimingInfo(task.timing);
    const catInfo = getCategoryIcon(task.category);

    const handleClick = () => {
        setShowNotes(true);
    };

    const handleComplete = () => {
        onComplete(task.id, notes || undefined);
        setShowNotes(false);
    };

    const handleQuickComplete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onComplete(task.id);
    };

    return (
        <>
            <div
                onClick={handleClick}
                className="flex items-start p-5 rounded-3xl cursor-pointer transition-all duration-300 border bg-white border-gray-100 hover:border-garden-green/30 hover:shadow-xl hover:shadow-garden-green/5"
            >
                <div
                    onClick={handleQuickComplete}
                    className="mr-4 flex-shrink-0 w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all border-gray-200 hover:border-garden-green hover:bg-garden-green/10 active:bg-garden-green/20"
                >
                    <i className={`fa-solid ${catInfo.icon} ${catInfo.color} text-sm opacity-60`}></i>
                </div>
                <div className="flex-grow">
                    <p className="font-bold text-lg text-gray-900">{task.task}</p>
                    <div className="flex items-center mt-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-garden-green/70 mr-2">{task.plantName}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full mr-2"></span>
                        <p className="text-sm text-gray-500">{task.reason}</p>
                    </div>
                    {task.windowStart && task.windowEnd && (
                        <p className="text-xs text-gray-400 mt-1">
                            <i className="fa-regular fa-calendar mr-1"></i>
                            {new Date(task.windowStart).toLocaleDateString()} - {new Date(task.windowEnd).toLocaleDateString()}
                        </p>
                    )}
                </div>
                <span className={`ml-2 px-3 py-1 text-[10px] font-black uppercase tracking-tighter rounded-xl whitespace-nowrap ${timingInfo.textColor} ${timingInfo.bgColor} border border-black/5 shadow-sm`}>
                    {timingInfo.label}
                </span>
            </div>

            {showNotes && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-start justify-center pt-16 overflow-y-auto" onClick={() => setShowNotes(false)}>
                    <div className="bg-white rounded-[32px] w-full max-w-lg mx-4 p-6 mb-8 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-end mb-2">
                            <button onClick={() => setShowNotes(false)} className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 active:bg-gray-300 transition-colors">
                                <i className="fa-solid fa-xmark text-gray-600 text-lg"></i>
                            </button>
                        </div>
                        <h3 className="font-black text-lg text-gray-900 mb-1">{task.task}</h3>
                        <p className="text-sm text-gray-500 mb-4">{task.plantName} &middot; {task.reason}</p>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder={t('addNotes')}
                            className="w-full h-24 p-4 bg-garden-beige/30 border-2 border-transparent rounded-2xl focus:bg-white focus:border-garden-yellow focus:ring-0 transition-all font-medium text-gray-700 outline-none text-sm mb-4"
                        />
                        <button
                            onClick={handleComplete}
                            className="w-full py-4 bg-garden-green text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-garden-green/20 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            <i className="fa-solid fa-check mr-2"></i>
                            {t('taskCompleted')}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export const HomeScreen: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { plants, isLoaded: isGardenLoaded } = useGarden();
    const { tasks, completedTasks, isLoading, isAdapting, error, completeTask } = useCareplan();

    const overdueTasks = useMemo(() => tasks.filter(t => t.timing === 'overdue'), [tasks]);
    const thisWeekTasks = useMemo(() => tasks.filter(t => t.timing === 'today' || t.timing === 'this_week'), [tasks]);
    const thisMonthTasks = useMemo(() => tasks.filter(t => t.timing === 'this_month'), [tasks]);

    const adviceTasks = useMemo(() => {
        // Exclude overdue tasks - they're shown in the Overdue section
        return tasks.filter(t => 
            (t.category === 'pruning' || t.category === 'grafting') && 
            t.timing !== 'overdue'
        );
    }, [tasks]);

    const regularTasks = useMemo(() => {
        return tasks.filter(t => t.category !== 'pruning' && t.category !== 'grafting');
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

            {isAdapting && (
                <div className="mb-6 p-4 bg-garden-yellow/20 rounded-2xl flex items-center space-x-3 border border-garden-yellow/30">
                    <i className="fa-solid fa-circle-notch animate-spin text-garden-green"></i>
                    <span className="text-sm font-bold text-gray-700">{t('adaptingTasks')}</span>
                </div>
            )}

            {/* Overdue Section */}
            {overdueTasks.length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center mb-4">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse"></div>
                        <h2 className="text-xl font-bold text-red-700 tracking-tight">{t('timingOverdue')}</h2>
                        <div className="h-0.5 flex-grow mx-4 bg-red-100 rounded-full"></div>
                        <span className="text-xs font-black text-red-500 bg-red-50 px-3 py-1 rounded-xl">{overdueTasks.length}</span>
                    </div>
                    <div className="space-y-3">
                        {overdueTasks.map(task => (
                            <TaskItem key={task.id} task={task} onComplete={completeTask} />
                        ))}
                    </div>
                </div>
            )}

            {/* Anica Advisor (pruning/grafting) */}
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
                            {adviceTasks.map(task => (
                                <TaskItem key={task.id} task={task} onComplete={completeTask} />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* This Week */}
            {thisWeekTasks.filter(t => t.category !== 'pruning' && t.category !== 'grafting').length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{t('timingThisWeek')}</h2>
                        <div className="h-1 flex-grow mx-4 bg-gray-100 rounded-full"></div>
                    </div>
                    <div className="space-y-3">
                        {thisWeekTasks.filter(t => t.category !== 'pruning' && t.category !== 'grafting').map(task => (
                            <TaskItem key={task.id} task={task} onComplete={completeTask} />
                        ))}
                    </div>
                </div>
            )}

            {/* This Month */}
            {thisMonthTasks.filter(t => t.category !== 'pruning' && t.category !== 'grafting').length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{t('timingThisMonth')}</h2>
                        <div className="h-1 flex-grow mx-4 bg-gray-100 rounded-full"></div>
                    </div>
                    <div className="space-y-3">
                        {thisMonthTasks.filter(t => t.category !== 'pruning' && t.category !== 'grafting').map(task => (
                            <TaskItem key={task.id} task={task} onComplete={completeTask} />
                        ))}
                    </div>
                </div>
            )}

            {/* Upcoming / General */}
            {regularTasks.filter(t => t.timing !== 'overdue' && t.timing !== 'today' && t.timing !== 'this_week' && t.timing !== 'this_month').length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{t('upcomingTasks')}</h2>
                        <div className="h-1 flex-grow mx-4 bg-gray-100 rounded-full"></div>
                    </div>
                    <div className="space-y-3">
                        {regularTasks.filter(t => t.timing !== 'overdue' && t.timing !== 'today' && t.timing !== 'this_week' && t.timing !== 'this_month').map(task => (
                            <TaskItem key={task.id} task={task} onComplete={completeTask} />
                        ))}
                    </div>
                </div>
            )}

            {/* Recently Completed */}
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

            {/* Empty State */}
            {tasks.length === 0 && completedTasks.length === 0 && (
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
