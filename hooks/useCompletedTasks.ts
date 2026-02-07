import { useState, useEffect, useCallback } from 'react';

const COMPLETED_TASKS_KEY = 'botanica_ai_completed_tasks';

interface StoredTasks {
  date: string; // YYYY-MM-DD
  taskIds: string[];
}

const getTodayString = () => new Date().toISOString().split('T')[0];

export const useCompletedTasks = () => {
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedData = localStorage.getItem(COMPLETED_TASKS_KEY);
      const today = getTodayString();
      
      if (storedData) {
        const parsedData: StoredTasks = JSON.parse(storedData);
        if (parsedData.date === today) {
          setCompletedTaskIds(parsedData.taskIds);
        } else {
          // It's a new day, clear old tasks
          localStorage.removeItem(COMPLETED_TASKS_KEY);
        }
      }
    } catch (error) {
      console.error("Failed to load completed tasks from localStorage", error);
    }
    setIsLoaded(true);
  }, []);

  const saveCompletedTasks = useCallback((ids: string[]) => {
    try {
      const today = getTodayString();
      const dataToStore: StoredTasks = { date: today, taskIds: ids };
      localStorage.setItem(COMPLETED_TASKS_KEY, JSON.stringify(dataToStore));
      setCompletedTaskIds(ids);
    } catch (error) {
      console.error("Failed to save completed tasks to localStorage", error);
    }
  }, []);

  const toggleTaskCompletion = useCallback((taskId: string) => {
    const newIds = completedTaskIds.includes(taskId)
      ? completedTaskIds.filter(id => id !== taskId)
      : [...completedTaskIds, taskId];
    saveCompletedTasks(newIds);
  }, [completedTaskIds, saveCompletedTasks]);

  const isTaskCompleted = useCallback((taskId: string) => {
    if (!isLoaded) return false;
    return completedTaskIds.includes(taskId);
  }, [completedTaskIds, isLoaded]);

  return { isTaskCompleted, toggleTaskCompletion };
};