import React from 'react';
import { Screen } from '../types';
import { useTranslation } from '../hooks/useTranslation';

interface BottomNavProps {
  activeScreen: Screen;
  setActiveScreen: (screen: Screen) => void;
}

const NavItem: React.FC<{
  icon: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${
      isActive ? 'text-green-600' : 'text-gray-400 hover:text-green-500'
    }`}
  >
    <i className={`text-2xl ${icon}`}></i>
    <span className="text-xs mt-1">{label}</span>
  </button>
);

export const BottomNav: React.FC<BottomNavProps> = ({ activeScreen, setActiveScreen }) => {
  const { t } = useTranslation();
  
  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)] flex justify-around items-center">
      <NavItem
        icon="fa-solid fa-house"
        label={t('home')}
        isActive={activeScreen === 'home'}
        onClick={() => setActiveScreen('home')}
      />
      <NavItem
        icon="fa-solid fa-seedling"
        label={t('myGarden')}
        isActive={activeScreen === 'garden'}
        onClick={() => setActiveScreen('garden')}
      />
       <NavItem
        icon="fa-solid fa-user"
        label={t('profile')}
        isActive={activeScreen === 'profile'}
        onClick={() => setActiveScreen('profile')}
      />
    </div>
  );
};