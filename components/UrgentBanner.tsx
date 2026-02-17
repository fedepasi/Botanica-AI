import React, { useState } from 'react';
import { DisplayTask } from '../types';
import { useTranslation } from '../hooks/useTranslation';

interface UrgentBannerProps {
  tasks: DisplayTask[];
  onComplete: (id: string, notes?: string) => void;
}

export const UrgentBanner: React.FC<UrgentBannerProps> = ({ tasks, onComplete }) => {
  const [expanded, setExpanded] = useState(true);
  const { t } = useTranslation();

  if (tasks.length === 0) return null;

  const overdue = tasks.filter(t => t.timing === 'overdue');
  const today = tasks.filter(t => t.timing === 'today');

  return (
    <div className="mb-6 rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-orange-50 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center p-4"
      >
        <div className="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse"></div>
        <span className="font-bold text-red-700 text-base flex-grow text-left">
          {tasks.length} {tasks.length === 1 ? t('urgentSingular') : t('urgentPlural')}
        </span>
        <i className={`fa-solid fa-chevron-down text-red-300 text-xs transition-transform ${expanded ? 'rotate-180' : ''}`}></i>
      </button>

      {/* Task list */}
      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {overdue.map(task => (
            <div key={task.id} className="flex items-center bg-white/60 rounded-xl p-3">
              <button
                onClick={() => onComplete(task.id)}
                className="mr-3 flex-shrink-0 w-7 h-7 rounded-lg border-2 border-red-300 flex items-center justify-center hover:bg-red-100 transition-all"
              >
                <i className="fa-solid fa-check text-transparent hover:text-red-500 text-[10px]"></i>
              </button>
              <div className="flex-grow min-w-0">
                <p className="font-semibold text-sm text-gray-800 truncate">{task.task}</p>
                <span className="text-xs text-red-500 font-medium">{task.plantName}</span>
              </div>
              <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-red-100 text-red-700 rounded-lg">
                {t('timingOverdue')}
              </span>
            </div>
          ))}
          {today.map(task => (
            <div key={task.id} className="flex items-center bg-white/60 rounded-xl p-3">
              <button
                onClick={() => onComplete(task.id)}
                className="mr-3 flex-shrink-0 w-7 h-7 rounded-lg border-2 border-yellow-400 flex items-center justify-center hover:bg-yellow-100 transition-all"
              >
                <i className="fa-solid fa-check text-transparent hover:text-yellow-600 text-[10px]"></i>
              </button>
              <div className="flex-grow min-w-0">
                <p className="font-semibold text-sm text-gray-800 truncate">{task.task}</p>
                <span className="text-xs text-yellow-600 font-medium">{task.plantName}</span>
              </div>
              <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-yellow-100 text-yellow-700 rounded-lg">
                {t('timingToday')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
