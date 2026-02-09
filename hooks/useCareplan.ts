import { useContext } from 'react';
import { CareplanContext } from '../contexts/CareplanContext';

export const useCareplan = () => {
  const context = useContext(CareplanContext);
  if (!context) {
    throw new Error('useCareplan must be used within a CareplanProvider');
  }
  return context;
};
