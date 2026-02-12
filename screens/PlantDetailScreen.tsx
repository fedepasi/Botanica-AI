import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateDetailedCarePlan, carePlanToHtml } from '../services/geminiService';
import { supabaseService } from '../services/supabaseService';
import { Spinner } from '../components/Spinner';
import { useGarden } from '../hooks/useGarden';
import { useTranslation } from '../hooks/useTranslation';
import { useCareplan } from '../hooks/useCareplan';
import { useAuth } from '../contexts/AuthContext';
import { PersistentTask, TaskCategory } from '../types';

const MONTH_LABELS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

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

const PlantCalendar: React.FC<{ tasks: PersistentTask[] }> = ({ tasks }) => {
    const { t } = useTranslation();
    const { completeTask } = useCareplan();
    const [selectedTask, setSelectedTask] = useState<PersistentTask | null>(null);

    const now = new Date();
    const year = now.getFullYear();
    const yearStart = new Date(year, 0, 1).getTime();
    const yearEnd = new Date(year, 11, 31).getTime();
    const todayPct = ((now.getTime() - yearStart) / (yearEnd - yearStart)) * 100;

    const categoryGroups = useMemo(() => {
        const groups = new Map<TaskCategory, PersistentTask[]>();
        tasks.forEach(task => {
            const existing = groups.get(task.category) || [];
            existing.push(task);
            groups.set(task.category, existing);
        });
        return Array.from(groups.entries());
    }, [tasks]);

    if (tasks.length === 0) return null;

    return (
        <div className="mb-10 pt-6 border-t border-gray-50">
            <h2 className="text-2xl font-black text-gray-900 mb-6 tracking-tight">
                <span className="highlight-yellow inline-block">{t('annualCalendar')}</span>
            </h2>

            <div className="bg-garden-beige/30 rounded-3xl p-4 border border-garden-green/10">
                <div className="flex mb-3 pl-20">
                    {MONTH_LABELS.map((m, i) => (
                        <div key={i} className="flex-1 text-center text-[9px] font-bold text-gray-400">{m}</div>
                    ))}
                </div>

                <div className="space-y-2">
                    {categoryGroups.map(([category, catTasks]) => (
                        <div key={category} className="flex items-center">
                            <div className="w-20 flex-shrink-0 pr-2">
                                <div className="flex items-center space-x-1">
                                    <div className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[category]}`}></div>
                                    <span className="text-[9px] font-bold text-gray-500 truncate">{getCategoryLabel(category, t)}</span>
                                </div>
                            </div>
                            <div className="flex-grow relative h-6 bg-white/60 rounded-full">
                                {[...Array(11)].map((_, i) => (
                                    <div key={i} className="absolute top-0 bottom-0 w-px bg-gray-100/50" style={{ left: `${((i + 1) / 12) * 100}%` }}></div>
                                ))}
                                <div className="absolute top-0 bottom-0 w-0.5 bg-garden-green/50 z-10" style={{ left: `${todayPct}%` }}></div>
                                {catTasks.map(task => {
                                    let startPct = 0;
                                    let widthPct = 100 / 12;
                                    if (task.windowStart && task.windowEnd) {
                                        const start = Math.max(new Date(task.windowStart).getTime(), yearStart);
                                        const end = Math.min(new Date(task.windowEnd).getTime(), yearEnd);
                                        startPct = ((start - yearStart) / (yearEnd - yearStart)) * 100;
                                        widthPct = Math.max(((end - start) / (yearEnd - yearStart)) * 100, 2);
                                    } else if (task.scheduledMonth) {
                                        startPct = ((task.scheduledMonth - 1) / 12) * 100;
                                    }

                                    return (
                                        <div
                                            key={task.id}
                                            className={`absolute h-4 top-1 rounded-full cursor-pointer transition-all hover:scale-y-125 ${CATEGORY_COLORS[task.category]} ${task.status === 'completed' ? 'opacity-30' : ''}`}
                                            style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                                            onClick={() => setSelectedTask(task)}
                                            title={task.task}
                                        >
                                            {task.status === 'completed' && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <i className="fa-solid fa-check text-white text-[8px]"></i>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {tasks.filter(t => t.status === 'completed').length > 0 && (
                <div className="mt-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{t('recentlyCompleted')}</p>
                    <div className="space-y-1">
                        {tasks.filter(t => t.status === 'completed').map(task => (
                            <div key={task.id} className="flex items-center px-3 py-2 rounded-xl bg-white/40">
                                <i className="fa-solid fa-check text-garden-green text-xs mr-2"></i>
                                <span className="text-xs text-gray-500 font-medium">{task.task}</span>
                                {task.completedAt && (
                                    <span className="text-[10px] text-gray-400 ml-auto">{new Date(task.completedAt).toLocaleDateString()}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {selectedTask && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-start justify-center pt-16 overflow-y-auto" onClick={() => setSelectedTask(null)}>
                    <div className="bg-white rounded-[32px] w-full max-w-lg mx-4 p-6 mb-8 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-end mb-2">
                            <button onClick={() => setSelectedTask(null)} className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 active:bg-gray-300 transition-colors">
                                <i className="fa-solid fa-xmark text-gray-600 text-lg"></i>
                            </button>
                        </div>
                        <div className="flex items-center space-x-2 mb-3">
                            <div className={`w-3 h-3 rounded-full ${CATEGORY_COLORS[selectedTask.category]}`}></div>
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{getCategoryLabel(selectedTask.category, t)}</span>
                        </div>
                        <h3 className="font-black text-lg text-gray-900 mb-1">{selectedTask.task}</h3>
                        <p className="text-sm text-gray-500 mb-3">{selectedTask.reason}</p>
                        {selectedTask.windowStart && selectedTask.windowEnd && (
                            <p className="text-xs text-gray-400 mb-4">
                                <i className="fa-regular fa-calendar mr-1"></i>
                                {t('optimalWindow')}: {new Date(selectedTask.windowStart).toLocaleDateString()} - {new Date(selectedTask.windowEnd).toLocaleDateString()}
                            </p>
                        )}
                        {selectedTask.status === 'pending' && (
                            <button
                                onClick={async () => { await completeTask(selectedTask.id); setSelectedTask(null); }}
                                className="w-full py-4 bg-garden-green text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-garden-green/20 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                <i className="fa-solid fa-check mr-2"></i>
                                {t('taskCompleted')}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export const PlantDetailScreen: React.FC = () => {
    const { plantId } = useParams<{ plantId: string }>();
    const navigate = useNavigate();
    const { plants, isLoaded, removePlant, updatePlantNotes, updatePlantImage, refreshGarden } = useGarden();
    const { language, t } = useTranslation();
    const { allTasksForCalendar, refreshTasks } = useCareplan();
    const { user } = useAuth();

    const plant = plants.find(p => p.id === plantId);

    const [carePlanHtml, setCarePlanHtml] = useState<string>('');
    const [isLoadingCarePlan, setIsLoadingCarePlan] = useState(true);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [fromCache, setFromCache] = useState(false);
    const [lastGeneratedAt, setLastGeneratedAt] = useState<Date | null>(null);

    const [notes, setNotes] = useState('');
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const plantTasks = useMemo(() => {
        return allTasksForCalendar.filter(t => t.plantId === plantId);
    }, [allTasksForCalendar, plantId]);

    const loadCarePlan = async (forceRegenerate = false) => {
        if (!plant) return;

        if (forceRegenerate) {
            setIsRegenerating(true);
        } else {
            setIsLoadingCarePlan(true);
        }

        try {
            const cachedPlan = (!forceRegenerate && plant.cachedCarePlan) ? plant.cachedCarePlan : null;

            const result = await generateDetailedCarePlan(plant, language, {
                forceRegenerate,
                cachedPlan,
            });

            const html = carePlanToHtml(result.structured, language);
            setCarePlanHtml(html);
            setFromCache(result.fromCache);

            if (result.fromCache && plant.carePlanGeneratedAt) {
                setLastGeneratedAt(new Date(plant.carePlanGeneratedAt));
            } else {
                setLastGeneratedAt(new Date());
            }

            if (!result.fromCache && user) {
                await supabaseService.cacheCarePlan(plant.id, user.id, result.structured);
                await refreshGarden();
            }
        } catch (error) {
            console.error('Failed to fetch care plan:', error);
            setCarePlanHtml('<p class="text-red-500">Failed to load care plan. Please try again.</p>');
        } finally {
            setIsLoadingCarePlan(false);
            setIsRegenerating(false);
        }
    };

    useEffect(() => {
        if (plant) {
            setNotes(plant.notes || '');
            loadCarePlan();
        }
    }, [plant, language]);

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !plant) return;

        setIsUploadingImage(true);
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const base64 = e.target?.result as string;
                await updatePlantImage(plant.id, base64);
                setIsUploadingImage(false);
            };
            reader.onerror = () => {
                console.error('Failed to read file');
                setIsUploadingImage(false);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Failed to upload image:', error);
            setIsUploadingImage(false);
        }
    };

    const handleRegenerateCarePlan = async () => {
        if (!plant) return;
        await loadCarePlan(true);
    };

    if (!isLoaded) {
        return <Spinner text={t('loadingGarden')} />;
    }

    if (!plant) {
        return (
            <div className="p-6 pb-24 font-outfit min-h-screen bg-garden-beige flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                    <i className="fa-solid fa-leaf text-3xl text-gray-300"></i>
                </div>
                <p className="text-gray-500 font-medium mb-6">{t('plantNotFound') || 'Plant not found'}</p>
                <button
                    onClick={() => navigate('/garden')}
                    className="bg-garden-green text-white font-bold px-6 py-3 rounded-2xl hover:scale-105 transition-all"
                >
                    {t('backToGarden')}
                </button>
            </div>
        );
    }

    const handleRemovePlant = async () => {
        if (window.confirm(`${t('confirmRemovePlant')} ${plant.name}?`)) {
            await removePlant(plant.id);
            await refreshTasks();
            navigate('/garden');
        }
    };

    const handleSaveNotes = async () => {
        if (!plant) return;
        setIsSavingNotes(true);
        try {
            await updatePlantNotes(plant.id, notes);
        } catch (error) {
            console.error('Failed to save notes:', error);
        } finally {
            setTimeout(() => {
                setIsSavingNotes(false);
            }, 1500);
        }
    };

    const getLastGeneratedText = () => {
        if (!lastGeneratedAt) return '';
        const now = new Date();
        const diffMs = now.getTime() - lastGeneratedAt.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return t('generatedToday') || 'Generated today';
        if (diffDays === 1) return t('generatedYesterday') || 'Generated yesterday';
        return `${t('generated') || 'Generated'} ${diffDays} ${t('daysAgo') || 'days ago'}`;
    };

    return (
        <div className="p-6 pb-24 font-outfit min-h-screen bg-garden-beige">
            <button onClick={() => navigate('/garden')} className="flex items-center text-garden-green font-bold mb-6 hover:translate-x-[-4px] transition-transform">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mr-3 shadow-sm border border-gray-100">
                    <i className="fa-solid fa-arrow-left text-sm"></i>
                </div>
                {t('backToGarden')}
            </button>

            <div className="bg-white rounded-[48px] shadow-sm border border-gray-100 overflow-hidden mb-6">
                <div className="relative h-72">
                    {plant.imageUrl ? (
                        <img src={plant.imageUrl} alt={plant.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-garden-beige flex items-center justify-center">
                            <i className="fa-solid fa-seedling text-6xl text-garden-green/30"></i>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="absolute top-4 right-4 w-14 h-14 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg hover:bg-white active:scale-95 transition-all border border-white/50"
                        aria-label={t('changePhoto') || 'Change photo'}
                    >
                        {isUploadingImage ? (
                            <i className="fa-solid fa-circle-notch animate-spin text-garden-green text-xl"></i>
                        ) : (
                            <i className="fa-solid fa-camera text-garden-green text-xl"></i>
                        )}
                    </button>
                    
                    <div className="absolute bottom-6 left-6 right-6 text-white">
                        <h1 className="text-4xl font-black tracking-tight">{plant.name}</h1>
                        <p className="text-white/80 mt-1 font-medium italic">{plant.description}</p>
                    </div>
                </div>

                <div className="p-8">
                    <div className="bg-garden-beige/50 p-6 rounded-3xl border border-garden-green/10 mb-10">
                        <h3 className="font-black text-garden-green text-xs uppercase tracking-[0.2em] mb-2">{t('basicCare')}</h3>
                        <p className="text-gray-700 font-medium leading-relaxed">{plant.careNeeds}</p>
                    </div>

                    <PlantCalendar tasks={plantTasks} />

                    <div className="mb-10">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                                <span className="highlight-yellow inline-block">{t('detailedCarePlan')}</span>
                            </h2>
                            <button
                                onClick={handleRegenerateCarePlan}
                                disabled={isRegenerating}
                                className="flex items-center px-4 py-2 bg-garden-beige/70 hover:bg-garden-beige text-garden-green rounded-full text-sm font-bold transition-all disabled:opacity-50"
                                title={t('regenerateCarePlan') || 'Regenerate care plan'}
                            >
                                {isRegenerating ? (
                                    <i className="fa-solid fa-circle-notch animate-spin mr-2"></i>
                                ) : (
                                    <i className="fa-solid fa-rotate mr-2"></i>
                                )}
                                {t('regenerate') || 'Regenerate'}
                            </button>
                        </div>

                        {(fromCache || lastGeneratedAt) && !isLoadingCarePlan && (
                            <div className="flex items-center mb-4 text-xs text-gray-500">
                                <i className={`fa-solid ${fromCache ? 'fa-database' : 'fa-sparkles'} mr-2`}></i>
                                <span>
                                    {fromCache 
                                        ? `${t('fromCache') || 'From cache'} • ${getLastGeneratedText()}`
                                        : `${t('freshlyGenerated') || 'Freshly generated'} • ${getLastGeneratedText()}`
                                    }
                                </span>
                            </div>
                        )}

                        {isLoadingCarePlan ? (
                            <div className="py-10">
                                <Spinner text={t('generatingPlan')} />
                            </div>
                        ) : (
                            <div
                                className="prose prose-green max-w-none text-gray-600 font-medium leading-loose"
                                dangerouslySetInnerHTML={{ __html: carePlanHtml }}
                            />
                        )}
                    </div>

                    <div className="mb-10 pt-6 border-t border-gray-50">
                        <h2 className="text-2xl font-black text-gray-900 mb-6 tracking-tight">
                            <span className="highlight-yellow inline-block">{t('myNotes')}</span>
                        </h2>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={t('notesPlaceholder')}
                            className="w-full h-40 p-5 bg-garden-beige/30 border-2 border-transparent rounded-[32px] focus:bg-white focus:border-garden-yellow focus:ring-0 transition-all font-medium text-gray-700 outline-none"
                            aria-label={t('myNotes')}
                        />
                        <button
                            onClick={handleSaveNotes}
                            className={`w-full mt-4 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center ${isSavingNotes
                                    ? 'bg-garden-green text-white scale-95'
                                    : 'bg-garden-yellow text-gray-900 shadow-lg shadow-garden-yellow/20 hover:scale-105 active:scale-95'
                                }`}
                            disabled={isSavingNotes}
                        >
                            {isSavingNotes ? (
                                <><i className="fa-solid fa-check mr-2 text-sm"></i>{t('notesSaved')}</>
                            ) : (
                                <><i className="fa-solid fa-save mr-2 text-sm"></i>{t('saveNotes')}</>
                            )}
                        </button>
                    </div>

                    <div className="pt-10 border-t border-gray-50">
                        <button
                            onClick={handleRemovePlant}
                            className="w-full py-4 text-red-500 font-bold rounded-2xl hover:bg-red-50 transition-all flex items-center justify-center border border-red-100"
                        >
                            <i className="fa-solid fa-trash-can mr-2"></i>
                            {t('removeFromGarden')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
