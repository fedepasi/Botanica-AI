import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../contexts/AuthContext';

export const ProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();

  return (
    <div className="p-6 pb-24 font-outfit">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">{t('profile')}</h1>

      <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 mb-8 text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg overflow-hidden">
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <i className="fa-solid fa-user text-4xl text-green-600"></i>
          )}
        </div>
        <h2 className="text-xl font-bold text-gray-900">{user?.email}</h2>
        <p className="text-sm text-gray-500 mt-1 uppercase tracking-wider font-bold">Premium Member</p>
      </div>

      <div className="space-y-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mr-4">
              <i className="fa-solid fa-envelope text-blue-500"></i>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase">{t('email')}</p>
              <p className="font-semibold text-gray-700">{user?.email}</p>
            </div>
          </div>
        </div>

        <button
          onClick={signOut}
          className="w-full bg-white p-5 rounded-2xl shadow-sm border border-red-50 flex items-center justify-between text-left group hover:bg-red-50 transition-all mt-8"
        >
          <div className="flex items-center">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-right-from-bracket text-red-500"></i>
            </div>
            <span className="font-bold text-red-600">Sign Out</span>
          </div>
          <i className="fa-solid fa-chevron-right text-red-300"></i>
        </button>
      </div>
    </div>
  );
};