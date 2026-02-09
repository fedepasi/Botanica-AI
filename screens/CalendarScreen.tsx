import React, { useMemo, useState } from 'react';
import { useCareplan } from '../hooks/useCareplan';
import { useTranslation } from '../hooks/useTranslation';
import { PersistentTask, TaskCategory } from '../types';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_LABELS_IT = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

const CATEGORY_COLORS: Record<TaskCategory, string> = {
    pruning: 'bg-purple-400',
    grafting: 'bg-orange-400',
    watering: 'bg-blue-400',
    fertilizing: 'bg-green-500',
    harvesting: 'bg-yellow-400',
    pest_prevention: 'bg-red-400',
    seeding: 'bg-emerald-400',
    repotting: 'bg-amber-500',
    general: 'bg-gray-400',
};

const CATEGORY_COLORS_LIGHT: Record<TaskCategory, string> = {
    pruning: 'bg-purple-100',
    grafting: 'bg-orange-100',
    watering: 'bg-blue-100',
    fertilizing: 'bg-green-100',
    harvesting: 'bg-yellow-100',
    pest_prevention: 'bg-red-100',
    seeding: 'bg-emerald-100',
    repotting: 'bg-amber-100',
    general: 'bg-gray-100',
};

const getCategoryLabel = (cat: TaskCategory, t: (key: string) => string) => {
    const map: Record<TaskCategory, string> = {
        pruning: t('catPruning'),
        grafting: t('catGrafting'),
        watering: t('catWatering'),
        fertilizing: t('catFertilizing'),
        harvesting: t('catHarvesting'),
        pest_prevention: t('catPestPrevention'),
        seeding: t('catSeeding'),
        repotting: t('catRepotting'),
        general: t('catGeneral'),
    };
    return map[cat] || cat;
};

const TaskBar: React.FC<{ task: PersistentTask; onClick: (task: PersistentTask) => void }> = ({ task, onClick }) => {
    const now = new Date();
    const year = now.getFullYear();

    // Calculate bar position (percentage of year)
    let startPct = 0;
    let widthPct = 100 / 12; // default: one month

    if (task.windowStart && task.windowEnd) {
        const yearStart = new Date(year, 0, 1).getTime();
        const yearEnd = new Date(year, 11, 31).getTime();
        const totalDays = yearEnd - yearStart;
        const start = Math.max(new Date(task.windowStart).getTime(), yearStart);
        const end = Math.min(new Date(task.windowEnd).getTime(), yearEnd);
        startPct = ((start - yearStart) / totalDays) * 100;
        widthPct = Math.max(((end - start) / totalDays) * 100, 1.5); // min 1.5% width
    } else if (task.scheduledMonth) {
        startPct = ((task.scheduledMonth - 1) / 12) * 100;
        widthPct = (1 / 12) * 100;
    }

    const isCompleted = task.status === 'completed';
    const barColor = CATEGORY_COLORS[task.category] || 'bg-gray-400';

    return (
        <div
            className="absolute h-6 rounded-full cursor-pointer transition-all hover:scale-y-125 hover:shadow-md group"
            style={{ left: `${startPct}%`, width: `${widthPct}%`, top: '2px' }}
            onClick={() => onClick(task)}
            title={`${task.task} (${task.windowStart || ''} - ${task.windowEnd || ''})`}
        >
            <div className={`h-full rounded-full ${barColor} ${isCompleted ? 'opacity-40' : ''} relative`}>
                {isCompleted && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <i className="fa-solid fa-check text-white text-xs drop-shadow"></i>
                    </div>
                )}
            </div>
            <div className="absolute left-0 -top-8 bg-gray-900 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                {task.task}
            </div>
        </div>
    );
};

export const CalendarScreen: React.FC = () => {
    const { t, language } = useTranslation();
    const { allTasksForCalendar, completeTask } = useCareplan();
    const [selectedTask, setSelectedTask] = useState<PersistentTask | null>(null);
    const [filterPlant, setFilterPlant] = useState<string>('all');

    const months = language === 'it' ? MONTH_LABELS_IT : MONTH_LABELS;

    // Group tasks by plant
    const plantGroups = useMemo(() => {
        const groups = new Map<string, { plantName: string; plantId: string; tasks: PersistentTask[] }>();
        const filteredTasks = filterPlant === 'all'
            ? allTasksForCalendar
            : allTasksForCalendar.filter(t => t.plantId === filterPlant);

        filteredTasks.forEach(task => {
            const existing = groups.get(task.plantId);
            if (existing) {
                existing.tasks.push(task);
            } else {
                groups.set(task.plantId, {
                    plantName: task.plantName,
                    plantId: task.plantId,
                    tasks: [task],
                });
            }
        });
        return Array.from(groups.values());
    }, [allTasksForCalendar, filterPlant]);

    // Get unique plants for filter
    const uniquePlants = useMemo(() => {
        const seen = new Map<string, string>();
        allTasksForCalendar.forEach(t => {
            if (!seen.has(t.plantId)) seen.set(t.plantId, t.plantName);
        });
        return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
    }, [allTasksForCalendar]);

    // Today line position
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1).getTime();
    const yearEnd = new Date(now.getFullYear(), 11, 31).getTime();
    const todayPct = ((now.getTime() - yearStart) / (yearEnd - yearStart)) * 100;

    // Category legend - only show categories that exist in tasks
    const activeCategories = useMemo(() => {
        const cats = new Set<TaskCategory>();
        allTasksForCalendar.forEach(t => cats.add(t.category));
        return Array.from(cats);
    }, [allTasksForCalendar]);

    const handleTaskClick = (task: PersistentTask) => {
        setSelectedTask(task);
    };

    const handleComplete = async () => {
        if (selectedTask) {
            await completeTask(selectedTask.id);
            setSelectedTask(null);
        }
    };

    return (
        <div className="p-6 pb-24 font-outfit">
            <div className="mb-8 pt-4 text-center">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                    <span className="highlight-yellow inline-block px-2">{t('annualCalendar')}</span>
                </h1>
                <p className="text-gray-500 mt-2 text-sm font-medium italic">{now.getFullYear()}</p>
            </div>

            {/* Plant filter */}
            {uniquePlants.length > 1 && (
                <div className="mb-6 flex flex-wrap gap-2">
                    <button
                        onClick={() => setFilterPlant('all')}
                        className={`px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all min-h-[48px] ${filterPlant === 'all'
                                ? 'bg-garden-green text-white shadow-lg shadow-garden-green/20'
                                : 'bg-white text-gray-600 border border-gray-200 hover:border-garden-green/30 active:bg-gray-50'
                            }`}
                    >
                        {t('allPlants') || 'All'}
                    </button>
                    {uniquePlants.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setFilterPlant(p.id)}
                            className={`px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all min-h-[48px] ${filterPlant === p.id
                                    ? 'bg-garden-green text-white shadow-lg shadow-garden-green/20'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:border-garden-green/30 active:bg-gray-50'
                                }`}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Legend */}
            <div className="mb-6 flex flex-wrap gap-3">
                {activeCategories.map(cat => (
                    <div key={cat} className="flex items-center space-x-1.5">
                        <div className={`w-3 h-3 rounded-full ${CATEGORY_COLORS[cat]}`}></div>
                        <span className="text-xs font-medium text-gray-500">{getCategoryLabel(cat, t)}</span>
                    </div>
                ))}
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-6 overflow-x-auto">
                {/* Month headers */}
                <div className="flex mb-4 relative" style={{ minWidth: '600px' }}>
                    {months.map((m, i) => (
                        <div key={i} className="flex-1 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            {m}
                        </div>
                    ))}
                </div>

                {/* Plant rows */}
                {plantGroups.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <i className="fa-solid fa-calendar-xmark text-4xl mb-3 block"></i>
                        <p className="font-medium">{t('noTasksMessage')}</p>
                    </div>
                ) : (
                    <div className="space-y-1" style={{ minWidth: '600px' }}>
                        {plantGroups.map(group => (
                            <div key={group.plantId} className="flex items-start">
                                <div className="w-24 flex-shrink-0 pr-2">
                                    <p className="text-xs font-bold text-gray-700 truncate leading-8">{group.plantName}</p>
                                </div>
                                <div className="flex-grow relative h-8 bg-gray-50 rounded-full">
                                    {/* Month gridlines */}
                                    {[...Array(11)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="absolute top-0 bottom-0 w-px bg-gray-100"
                                            style={{ left: `${((i + 1) / 12) * 100}%` }}
                                        ></div>
                                    ))}
                                    {/* Today line */}
                                    <div
                                        className="absolute top-0 bottom-0 w-0.5 bg-garden-green z-10"
                                        style={{ left: `${todayPct}%` }}
                                    ></div>
                                    {/* Task bars */}
                                    {group.tasks.map(task => (
                                        <TaskBar key={task.id} task={task} onClick={handleTaskClick} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Today indicator label */}
                <div className="relative mt-2" style={{ minWidth: '600px' }}>
                    <div className="flex">
                        <div className="w-24 flex-shrink-0"></div>
                        <div className="flex-grow relative">
                            <div
                                className="absolute text-[9px] font-bold text-garden-green -translate-x-1/2"
                                style={{ left: `${todayPct}%` }}
                            >
                                <i className="fa-solid fa-caret-up mr-0.5"></i>
                                {t('timingToday')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Task detail modal */}
            {selectedTask && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-start justify-center pt-16 overflow-y-auto" onClick={() => setSelectedTask(null)}>
                    <div className="bg-white rounded-[32px] w-full max-w-lg mx-4 p-6 mb-8 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-end mb-2">
                            <button onClick={() => setSelectedTask(null)} className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 active:bg-gray-300 transition-colors">
                                <i className="fa-solid fa-xmark text-gray-600 text-lg"></i>
                            </button>
                        </div>
                        <div className="flex items-center space-x-3 mb-4">
                            <div className={`w-4 h-4 rounded-full ${CATEGORY_COLORS[selectedTask.category]}`}></div>
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{getCategoryLabel(selectedTask.category, t)}</span>
                        </div>
                        <h3 className="font-black text-xl text-gray-900 mb-1">{selectedTask.task}</h3>
                        <p className="text-sm text-garden-green font-bold mb-2">{selectedTask.plantName}</p>
                        <p className="text-sm text-gray-500 mb-4">{selectedTask.reason}</p>
                        {selectedTask.windowStart && selectedTask.windowEnd && (
                            <div className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold mb-4 ${CATEGORY_COLORS_LIGHT[selectedTask.category]} text-gray-700`}>
                                <i className="fa-regular fa-calendar mr-2"></i>
                                {t('optimalWindow')}: {new Date(selectedTask.windowStart).toLocaleDateString()} - {new Date(selectedTask.windowEnd).toLocaleDateString()}
                            </div>
                        )}
                        {selectedTask.status === 'pending' ? (
                            <button
                                onClick={handleComplete}
                                className="w-full py-4 bg-garden-green text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-garden-green/20 hover:scale-[1.02] active:scale-95 transition-all mt-2"
                            >
                                <i className="fa-solid fa-check mr-2"></i>
                                {t('taskCompleted')}
                            </button>
                        ) : (
                            <div className="w-full py-4 bg-gray-100 text-gray-400 font-black uppercase tracking-widest text-xs rounded-2xl text-center mt-2">
                                <i className="fa-solid fa-check-double mr-2"></i>
                                {t('taskCompleted')}
                                {selectedTask.completedAt && (
                                    <span className="ml-2 font-medium normal-case">{new Date(selectedTask.completedAt).toLocaleDateString()}</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
