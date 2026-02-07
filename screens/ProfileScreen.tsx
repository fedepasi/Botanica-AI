import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

export const ProfileScreen: React.FC = () => {
  const { language, setLanguage, t } = useTranslation();

  return (
    <div className="p-4 pb-20">
      <h1 className="text-3xl font-bold text-green-800 mb-6">{t('myProfile')}</h1>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">{t('languageSettings')}</h2>
        <p className="text-gray-500 mb-3">{t('selectLanguage')}</p>
        <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setLanguage('en')}
            className={`w-full px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              language === 'en' ? 'bg-green-500 text-white shadow' : 'bg-transparent text-gray-600'
            }`}
          >
            {t('english')}
          </button>
          <button
            onClick={() => setLanguage('it')}
            className={`w-full px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              language === 'it' ? 'bg-green-500 text-white shadow' : 'bg-transparent text-gray-600'
            }`}
          >
            {t('italian')}
          </button>
        </div>
      </div>
    </div>
  );
};