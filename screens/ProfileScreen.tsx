import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../contexts/AuthContext';

const APP_URL = 'https://botanica-ai.vercel.app';

export const ProfileScreen: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();
  const { user, signOut } = useAuth();
  const [linkCopied, setLinkCopied] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: 'Botanica-AI — Il tuo orticoltore AI personale',
      text: language === 'it'
        ? '🌱 Ho trovato questa app fantastica per gestire il mio orto con l\'AI! Prova Botanica-AI gratis.'
        : '🌱 Found this amazing app to manage my garden with AI! Try Botanica-AI for free.',
      url: APP_URL,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(APP_URL);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 3000);
      }
    } catch (err) {
      // User cancelled share or clipboard failed
      console.log('Share cancelled or failed', err);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(APP_URL);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    } catch (err) {
      console.log('Copy failed', err);
    }
  };

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

        {/* Beta Tester Box */}
        <div className="bg-white rounded-[40px] shadow-sm border-2 border-garden-green/20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-garden-green to-garden-green/80 p-6 pb-5">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <i className="fa-solid fa-seedling text-white text-lg"></i>
              </div>
              <h3 className="text-white font-black text-sm uppercase tracking-widest">{t('betaTitle')}</h3>
            </div>
            <p className="text-white/80 text-xs leading-relaxed font-medium">{t('betaDesc')}</p>
          </div>

          {/* Share Section */}
          <div className="p-6 space-y-4">
            <div>
              <p className="text-[10px] text-garden-green font-black uppercase tracking-widest mb-1">{t('betaShareTitle')}</p>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">{t('betaShareDesc')}</p>
            </div>

            {/* Share URL display */}
            <div className="flex items-center bg-garden-beige rounded-2xl px-4 py-3 gap-3">
              <i className="fa-solid fa-link text-garden-green text-sm flex-shrink-0"></i>
              <span className="text-xs text-gray-600 font-medium flex-1 truncate">botanica-ai.vercel.app</span>
              <button
                onClick={handleCopyLink}
                className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl transition-all ${
                  linkCopied
                    ? 'bg-green-100 text-green-700'
                    : 'bg-garden-green/10 text-garden-green hover:bg-garden-green/20'
                }`}
              >
                {linkCopied ? t('betaLinkCopied') : t('betaCopyLink')}
              </button>
            </div>

            {/* Share button */}
            <button
              onClick={handleShare}
              className="w-full bg-garden-green text-white py-4 rounded-[24px] font-black text-xs uppercase tracking-widest flex items-center justify-center space-x-2 shadow-lg shadow-garden-green/20 active:scale-95 transition-all hover:bg-garden-green/90"
            >
              <i className="fa-solid fa-share-nodes text-sm"></i>
              <span>{t('betaShareButton')}</span>
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
            <span className="font-black uppercase tracking-widest text-xs text-red-600">{t('signOut')}</span>
          </div>
          <i className="fa-solid fa-chevron-right text-red-200 group-hover:translate-x-1 transition-transform"></i>
        </button>
      </div>
    </div>
  );
};