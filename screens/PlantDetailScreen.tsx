import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateDetailedCarePlan } from '../services/geminiService';
import { Spinner } from '../components/Spinner';
import { useGarden } from '../hooks/useGarden';
import { useTranslation } from '../hooks/useTranslation';

export const PlantDetailScreen: React.FC = () => {
  const { plantId } = useParams<{ plantId: string }>();
  const navigate = useNavigate();
  const { plants, isLoaded, removePlant, updatePlantNotes } = useGarden();
  const { language, t } = useTranslation();

  const plant = plants.find(p => p.id === plantId);

  const [carePlan, setCarePlan] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  useEffect(() => {
    if (plant) {
      setNotes(plant.notes || '');
    }
  }, [plant]);

  useEffect(() => {
    if (!plant) return;
    const fetchCarePlan = async () => {
      setIsLoading(true);
      const plan = await generateDetailedCarePlan(plant, language);
      setCarePlan(plan);
      setIsLoading(false);
    };
    fetchCarePlan();
  }, [plant, language]);

  if (!isLoaded) {
    return <Spinner text={t('loadingGarden')} />;
  }

  if (!plant) {
    return (
      <div className="p-6 pb-24 font-outfit min-h-screen bg-garden-beige flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
          <i className="fa-solid fa-leaf text-3xl text-gray-300"></i>
        </div>
        <p className="text-gray-500 font-medium mb-6">{t('plantNotFound') || 'Plant not found'}</p>
        <button
          onClick={() => navigate('/garden')}
          className="bg-garden-green text-white font-bold px-6 py-3 rounded-2xl hover:scale-105 transition-all"
        >
          {t('backToGarden')}
        </button>
      </div>
    );
  }

  const handleRemovePlant = () => {
    if (window.confirm(`${t('confirmRemovePlant')} ${plant.name}?`)) {
      removePlant(plant.id);
      navigate('/garden');
    }
  };

  const handleSaveNotes = () => {
    setIsSavingNotes(true);
    updatePlantNotes(plant.id, notes);
    setTimeout(() => {
      setIsSavingNotes(false);
    }, 1500);
  };

  return (
    <div className="p-6 pb-24 font-outfit min-h-screen bg-garden-beige">
      <button onClick={() => navigate('/garden')} className="flex items-center text-garden-green font-bold mb-6 hover:translate-x-[-4px] transition-transform">
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mr-3 shadow-sm border border-gray-100">
          <i className="fa-solid fa-arrow-left text-sm"></i>
        </div>
        {t('backToGarden')}
      </button>

      <div className="bg-white rounded-[48px] shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="relative h-72">
          {plant.imageUrl ? (
            <img src={plant.imageUrl} alt={plant.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-garden-beige flex items-center justify-center">
              <i className="fa-solid fa-seedling text-6xl text-garden-green/30"></i>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <h1 className="text-4xl font-black tracking-tight">{plant.name}</h1>
            <p className="text-white/80 mt-1 font-medium italic">{plant.description}</p>
          </div>
        </div>

        <div className="p-8">
          <div className="bg-garden-beige/50 p-6 rounded-3xl border border-garden-green/10 mb-10">
            <h3 className="font-black text-garden-green text-xs uppercase tracking-[0.2em] mb-2">{t('basicCare')}</h3>
            <p className="text-gray-700 font-medium leading-relaxed">{plant.careNeeds}</p>
          </div>

          <div className="mb-10">
            <h2 className="text-2xl font-black text-gray-900 mb-6 tracking-tight">
              <span className="highlight-yellow inline-block">{t('detailedCarePlan')}</span>
            </h2>
            {isLoading ? (
              <div className="py-10">
                <Spinner text={t('generatingPlan')} />
              </div>
            ) : (
              <div
                className="prose prose-green max-w-none text-gray-600 font-medium leading-loose"
                dangerouslySetInnerHTML={{ __html: carePlan }}
              />
            )}
          </div>

          <div className="mb-10 pt-6 border-t border-gray-50">
            <h2 className="text-2xl font-black text-gray-900 mb-6 tracking-tight">
              <span className="highlight-yellow inline-block">{t('myNotes')}</span>
            </h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('notesPlaceholder')}
              className="w-full h-40 p-5 bg-garden-beige/30 border-2 border-transparent rounded-[32px] focus:bg-white focus:border-garden-yellow focus:ring-0 transition-all font-medium text-gray-700 outline-none"
              aria-label={t('myNotes')}
            />
            <button
              onClick={handleSaveNotes}
              className={`w-full mt-4 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center ${isSavingNotes
                  ? 'bg-garden-green text-white scale-95'
                  : 'bg-garden-yellow text-gray-900 shadow-lg shadow-garden-yellow/20 hover:scale-105 active:scale-95'
                }`}
              disabled={isSavingNotes}
            >
              {isSavingNotes ? (
                <><i className="fa-solid fa-check mr-2 text-sm"></i>{t('notesSaved')}</>
              ) : (
                <><i className="fa-solid fa-save mr-2 text-sm"></i>{t('saveNotes')}</>
              )}
            </button>
          </div>

          <div className="pt-10 border-t border-gray-50">
            <button
              onClick={handleRemovePlant}
              className="w-full py-4 text-red-500 font-bold rounded-2xl hover:bg-red-50 transition-all flex items-center justify-center border border-red-100"
            >
              <i className="fa-solid fa-trash-can mr-2"></i>
              {t('removeFromGarden')}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
