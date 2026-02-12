import { useMemo, useState, useCallback } from 'react';
import { useCareplan } from './useCareplan';
import { DisplayTask, TaskCategory } from '../types';

export interface PlantTaskGroup {
  plantId: string;
  plantName: string;
  tasks: DisplayTask[];
}

export interface TasksByCategory {
  category: TaskCategory;
  categoryLabel: string;
  icon: string;
  color: string;
  bgColor: string;
  plantGroups: PlantTaskGroup[];
  totalTasks: number;
  urgentTasks: number;
}

const CATEGORY_META: Record<TaskCategory, { icon: string; color: string; bgColor: string; labelKey: string }> = {
  pruning:         { icon: 'fa-scissors',      color: 'text-purple-500',  bgColor: 'bg-purple-50',  labelKey: 'catPruning' },
  grafting:        { icon: 'fa-code-branch',    color: 'text-orange-500',  bgColor: 'bg-orange-50',  labelKey: 'catGrafting' },
  watering:        { icon: 'fa-droplet',        color: 'text-blue-500',    bgColor: 'bg-blue-50',    labelKey: 'catWatering' },
  fertilizing:     { icon: 'fa-flask',          color: 'text-green-600',   bgColor: 'bg-green-50',   labelKey: 'catFertilizing' },
  harvesting:      { icon: 'fa-apple-whole',    color: 'text-yellow-600',  bgColor: 'bg-yellow-50',  labelKey: 'catHarvesting' },
  pest_prevention: { icon: 'fa-shield-virus',   color: 'text-red-500',     bgColor: 'bg-red-50',     labelKey: 'catPestPrevention' },
  seeding:         { icon: 'fa-seedling',       color: 'text-emerald-500', bgColor: 'bg-emerald-50', labelKey: 'catSeeding' },
  repotting:       { icon: 'fa-bucket',         color: 'text-amber-600',   bgColor: 'bg-amber-50',   labelKey: 'catRepotting' },
  general:         { icon: 'fa-leaf',           color: 'text-green-500',   bgColor: 'bg-gray-50',    labelKey: 'catGeneral' },
};

export const useGroupedTasks = (t: (key: string) => string) => {
  const { tasks, completedTasks, completeTask } = useCareplan();

  const [expandedCategories, setExpandedCategories] = useState<Set<TaskCategory>>(() => new Set());

  // Urgent tasks (overdue + today) shown separately at top
  const urgentTasks = useMemo(
    () => tasks.filter(tk => tk.timing === 'overdue' || tk.timing === 'today'),
    [tasks]
  );

  // All non-urgent tasks grouped by category
  const groupedTasks = useMemo(() => {
    const nonUrgent = tasks.filter(tk => tk.timing !== 'overdue' && tk.timing !== 'today');
    const groups = new Map<TaskCategory, TasksByCategory>();

    nonUrgent.forEach(task => {
      const cat = task.category || 'general';
      if (!groups.has(cat)) {
        const meta = CATEGORY_META[cat] || CATEGORY_META.general;
        groups.set(cat, {
          category: cat,
          categoryLabel: t(meta.labelKey),
          icon: meta.icon,
          color: meta.color,
          bgColor: meta.bgColor,
          plantGroups: [],
          totalTasks: 0,
          urgentTasks: 0,
        });
      }
      const group = groups.get(cat)!;
      group.totalTasks++;

      let pg = group.plantGroups.find(p => p.plantId === task.plantId);
      if (!pg) {
        pg = { plantId: task.plantId, plantName: task.plantName, tasks: [] };
        group.plantGroups.push(pg);
      }
      pg.tasks.push(task);
    });

    // Sort: categories with more tasks first
    return Array.from(groups.values()).sort((a, b) => b.totalTasks - a.totalTasks);
  }, [tasks, t]);

  // Auto-expand first category if nothing is expanded yet
  useMemo(() => {
    if (expandedCategories.size === 0 && groupedTasks.length > 0) {
      setExpandedCategories(new Set([groupedTasks[0].category]));
    }
  }, [groupedTasks.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleCategory = useCallback((category: TaskCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, []);

  return {
    urgentTasks,
    groupedTasks,
    expandedCategories,
    toggleCategory,
    completedTasks,
    completeTask,
  };
};
