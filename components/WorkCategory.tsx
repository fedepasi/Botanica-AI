import React from 'react';
import { TasksByCategory, PlantTaskGroup } from '../hooks/useGroupedTasks';
import { DisplayTask } from '../types';

interface TaskItemProps {
  task: DisplayTask;
  onComplete: (id: string, notes?: string) => void;
  compact?: boolean;
}

const TaskItemRow: React.FC<TaskItemProps> = ({ task, onComplete }) => {
  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComplete(task.id);
  };

  const getTimingBadge = (timing: DisplayTask['timing']) => {
    switch (timing) {
      case 'this_week': return { label: 'This week', cls: 'text-blue-700 bg-blue-50' };
      case 'this_month': return { label: 'This month', cls: 'text-indigo-700 bg-indigo-50' };
      default: return { label: 'Upcoming', cls: 'text-gray-600 bg-gray-50' };
    }
  };

  const badge = getTimingBadge(task.timing);

  return (
    <div className="flex items-center py-3 group">
      <button
        onClick={handleComplete}
        className="mr-3 flex-shrink-0 w-7 h-7 rounded-lg border-2 border-gray-200 flex items-center justify-center transition-all hover:border-garden-green hover:bg-garden-green/10 active:bg-garden-green active:border-garden-green"
      >
        <i className="fa-solid fa-check text-transparent group-hover:text-garden-green text-[10px] transition-colors"></i>
      </button>
      <div className="flex-grow min-w-0">
        <p className="font-semibold text-sm text-gray-800 truncate">{task.task}</p>
        <p className="text-xs text-gray-400 truncate">{task.reason}</p>
      </div>
      <span className={`ml-2 px-2 py-0.5 text-[9px] font-bold uppercase tracking-tight rounded-lg whitespace-nowrap ${badge.cls}`}>
        {badge.label}
      </span>
    </div>
  );
};

const PlantGroup: React.FC<{ group: PlantTaskGroup; onComplete: (id: string, notes?: string) => void }> = ({ group, onComplete }) => (
  <div className="mb-3 last:mb-0">
    <div className="flex items-center mb-1 px-1">
      <span className="text-xs font-bold uppercase tracking-wider text-garden-green/70">{group.plantName}</span>
      <span className="text-[10px] text-gray-300 ml-2">({group.tasks.length})</span>
    </div>
    <div className="divide-y divide-gray-50">
      {group.tasks.map(task => (
        <TaskItemRow key={task.id} task={task} onComplete={onComplete} />
      ))}
    </div>
  </div>
);

interface WorkCategoryProps {
  group: TasksByCategory;
  isExpanded: boolean;
  onToggle: () => void;
  onComplete: (id: string, notes?: string) => void;
}

export const WorkCategory: React.FC<WorkCategoryProps> = ({ group, isExpanded, onToggle, onComplete }) => {
  const plantCount = group.plantGroups.length;

  return (
    <div className={`mb-3 rounded-2xl border transition-all duration-200 ${isExpanded ? 'border-gray-200 shadow-sm' : 'border-gray-100'}`}>
      {/* Header - always visible */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center p-4 rounded-2xl transition-all ${isExpanded ? `${group.bgColor}` : 'hover:bg-gray-50'}`}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${group.bgColor}`}>
          <i className={`fa-solid ${group.icon} ${group.color} text-lg`}></i>
        </div>
        <div className="ml-3 text-left flex-grow">
          <span className="font-bold text-gray-800 text-base">{group.categoryLabel}</span>
          <span className="text-xs text-gray-400 ml-2">
            {plantCount} {plantCount === 1 ? 'pianta' : 'piante'} · {group.totalTasks} task
          </span>
        </div>
        <i className={`fa-solid fa-chevron-right text-gray-300 text-sm transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}></i>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1">
          {group.plantGroups.map(pg => (
            <PlantGroup key={pg.plantId} group={pg} onComplete={onComplete} />
          ))}
        </div>
      )}
    </div>
  );
};
