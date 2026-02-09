import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';

const NavItem: React.FC<{
  icon: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-full pt-3 pb-2 transition-all duration-300 relative ${isActive ? 'text-garden-green scale-110' : 'text-gray-400 hover:text-garden-green/70'
      }`}
  >
    <div className="relative">
      <i className={`text-xl ${icon}`}></i>
      {isActive && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-garden-yellow rounded-full shadow-sm animate-pulse"></div>
      )}
    </div>
    <span className={`text-[10px] mt-1 font-bold uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
  </button>
);

export const BottomNav: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-white shadow-[0_-5px_20px_rgba(0,0,0,0.05)] flex justify-around items-center px-4 rounded-t-[32px] border-t border-gray-100 z-50">
      <NavItem
        icon="fa-solid fa-house"
        label={t('home')}
        isActive={path === '/'}
        onClick={() => navigate('/')}
      />
      <NavItem
        icon="fa-solid fa-seedling"
        label={t('myGarden')}
        isActive={path.startsWith('/garden')}
        onClick={() => navigate('/garden')}
      />
      <NavItem
        icon="fa-solid fa-calendar-days"
        label={t('calendarTab')}
        isActive={path === '/calendar'}
        onClick={() => navigate('/calendar')}
      />
      <NavItem
        icon="fa-solid fa-comment-dots"
        label={t('botanicaAdvisor')}
        isActive={path === '/chat'}
        onClick={() => navigate('/chat')}
      />
      <NavItem
        icon="fa-solid fa-user"
        label={t('profile')}
        isActive={path === '/profile'}
        onClick={() => navigate('/profile')}
      />
    </div>
  );
};
