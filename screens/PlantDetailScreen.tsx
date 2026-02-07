// FIX: Implemented the PlantDetailScreen component which was previously a placeholder.
import React, { useState, useEffect } from 'react';
import { Plant } from '../types';
import { generateDetailedCarePlan } from '../services/geminiService';
import { Spinner } from '../components/Spinner';
import { useGarden } from '../hooks/useGarden';
import { useTranslation } from '../hooks/useTranslation';

interface PlantDetailScreenProps {
  plant: Plant;
  onBack: () => void;
}

export const PlantDetailScreen: React.FC<PlantDetailScreenProps> = ({ plant, onBack }) => {
  const [carePlan, setCarePlan] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const { removePlant, updatePlantNotes } = useGarden();
  const { language, t } = useTranslation();
  const [notes, setNotes] = useState(plant.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  useEffect(() => {
    const fetchCarePlan = async () => {
      setIsLoading(true);
      const plan = await generateDetailedCarePlan(plant, language);
      setCarePlan(plan);
      setIsLoading(false);
    };
    fetchCarePlan();
  }, [plant, language]);

  const handleRemovePlant = () => {
    if (window.confirm(`${t('confirmRemovePlant')} ${plant.name}?`)) {
      removePlant(plant.id);
      onBack();
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
    <div className="p-4 pb-20">
      <button onClick={onBack} className="flex items-center text-green-600 font-semibold mb-4">
        <i className="fa-solid fa-arrow-left mr-2"></i>
        {t('backToGarden')}
      </button>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <img src={plant.imageUrl} alt={plant.name} className="w-full h-56 object-cover" />
        <div className="p-6">
          <h1 className="text-3xl font-bold text-green-800">{plant.name}</h1>
          <p className="text-gray-600 mt-2">{plant.description}</p>
          <div className="mt-4 bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800">{t('basicCare')}</h3>
            <p className="text-sm text-green-700 mt-1">{plant.careNeeds}</p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('detailedCarePlan')}</h2>
          {isLoading ? (
            <Spinner text={t('generatingPlan')} />
          ) : (
            <div
              className="prose prose-green max-w-none"
              dangerouslySetInnerHTML={{ __html: carePlan }}
            />
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('myNotes')}</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('notesPlaceholder')}
            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:outline-none"
            aria-label={t('myNotes')}
          />
          <button
            onClick={handleSaveNotes}
            className={`w-full mt-3 py-2 text-white font-bold rounded-lg shadow-md transition-colors ${isSavingNotes ? 'bg-green-500' : 'bg-blue-500 hover:bg-blue-600'}`}
            disabled={isSavingNotes}
          >
            {isSavingNotes ? (
              <><i className="fa-solid fa-check mr-2"></i>{t('notesSaved')}</>
            ) : (
              <><i className="fa-solid fa-save mr-2"></i>{t('saveNotes')}</>
            )}
          </button>
        </div>
        
        <div className="p-6 bg-gray-50 border-t border-gray-200">
            <button
                onClick={handleRemovePlant}
                className="w-full py-3 bg-red-500 text-white font-bold rounded-lg shadow-md hover:bg-red-600 transition-colors"
            >
                <i className="fa-solid fa-trash-can mr-2"></i>
                {t('removeFromGarden')}
            </button>
        </div>

      </div>
    </div>
  );
};