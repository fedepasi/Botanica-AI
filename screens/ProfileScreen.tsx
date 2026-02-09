import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../contexts/AuthContext';

export const ProfileScreen: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();
  const { user, signOut } = useAuth();

  return (
    <div className="p-6 pb-24 font-outfit min-h-screen bg-garden-beige">
      <div className="mb-10 pt-4">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-tight">
          <span className="highlight-yellow inline-block">{t('profile')}</span>
        </h1>
      </div>

      <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 mb-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-garden-yellow"></div>
        <div className="w-28 h-28 bg-garden-green rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-garden-green/20 border-4 border-white overflow-hidden transform hover:rotate-3 transition-transform">
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <i className="fa-solid fa-user text-5xl text-white"></i>
          )}
        </div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">{user?.email?.split('@')[0]}</h2>
        <div className="mt-3 inline-block px-4 py-1.5 bg-garden-yellow rounded-full shadow-sm">
          <p className="text-[10px] text-gray-900 uppercase tracking-widest font-black italic">Botanica Premium Member</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-garden-beige rounded-2xl flex items-center justify-center mr-4 text-garden-green">
              <i className="fa-solid fa-envelope text-xl"></i>
            </div>
            <div>
              <p className="text-[10px] text-garden-green font-black uppercase tracking-widest mb-0.5">{t('email')}</p>
              <p className="font-bold text-gray-700">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-garden-beige rounded-2xl flex items-center justify-center mr-4 text-garden-green">
              <i className="fa-solid fa-language text-xl"></i>
            </div>
            <div>
              <p className="text-[10px] text-garden-green font-black uppercase tracking-widest mb-0.5">{t('languageSettings')}</p>
              <p className="font-bold text-gray-900">{t('selectLanguage')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setLanguage('en')}
              className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-center justify-center space-y-2 ${language === 'en'
                ? 'border-garden-green bg-garden-green/5 shadow-md shadow-garden-green/10'
                : 'border-transparent bg-garden-beige/30 grayscale opacity-60 hover:opacity-100 hover:grayscale-0'
                }`}
            >
              <span className="text-2xl">🇬🇧</span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${language === 'en' ? 'text-garden-green' : 'text-gray-500'}`}>
                {t('english')}
              </span>
            </button>
            <button
              onClick={() => setLanguage('it')}
              className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-center justify-center space-y-2 ${language === 'it'
                ? 'border-garden-green bg-garden-green/5 shadow-md shadow-garden-green/10'
                : 'border-transparent bg-garden-beige/30 grayscale opacity-60 hover:opacity-100 hover:grayscale-0'
                }`}
            >
              <span className="text-2xl">🇮🇹</span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${language === 'it' ? 'text-garden-green' : 'text-gray-500'}`}>
                {t('italian')}
              </span>
            </button>
          </div>
        </div>

        <button
          onClick={signOut}
          className="w-full bg-white p-6 rounded-[32px] shadow-sm border border-red-50 flex items-center justify-between text-left group hover:bg-red-50 transition-all mt-10"
        >
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-all">
              <i className="fa-solid fa-right-from-bracket text-red-500 text-xl"></i>
            </div>
            <span className="font-black uppercase tracking-widest text-xs text-red-600">Sign Out</span>
          </div>
          <i className="fa-solid fa-chevron-right text-red-200 group-hover:translate-x-1 transition-transform"></i>
        </button>
      </div>
    </div>
  );
};