import React, { useState, useRef, useEffect } from 'react';
import { identifyPlant, searchPlantByName } from '../services/geminiService';
import { Spinner } from '../components/Spinner';
import { useGarden } from '../hooks/useGarden';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../contexts/AuthContext';
import { supabaseService } from '../services/supabaseService';

interface AddPlantScreenProps {
  onBack: () => void;
  onPlantAdded: () => void;
}

interface ResultData {
  name: string;
  description: string;
  careNeeds: string;
  imageUrl: string;
}

export const AddPlantScreen: React.FC<AddPlantScreenProps> = ({ onBack, onPlantAdded }) => {
  const { language, t } = useTranslation();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { addPlant, plantExists } = useGarden();

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Cleanup effect
  useEffect(() => {
    // Request location on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoordinates({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("Geolocation error:", err)
      );
    }
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    stopCamera(); // Stop any existing stream
    setResultData(null);
    setImagePreview(null);
    setError(null);
    setIsLoading(true); // Show spinner while camera starts

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera not supported on this browser.");
      }
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError(t('errorCamera'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCapture = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setImagePreview(dataUrl);
        stopCamera();

        // Start analysis
        setError(null);
        setIsLoading(true);
        try {
          const base64Image = dataUrl.split(',')[1];
          const result = await identifyPlant(base64Image, 'image/jpeg', language);
          setResultData({ ...result, imageUrl: dataUrl });
        } catch (err) {
          setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError(t('errorEnterPlantName'));
      return;
    }
    stopCamera();
    setImagePreview(null);
    setResultData(null);
    setError(null);
    setIsSearching(true);
    try {
      const result = await searchPlantByName(searchQuery, language);
      setResultData(result);
      setImagePreview(result.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred during search.");
    } finally {
      setIsSearching(false);
    }
  }

  const handleAddPlant = async () => {
    if (resultData && user) {
      setIsLoading(true);
      setError(null);
      try {
        let finalImageUrl = resultData.imageUrl;

        // If it's a base64 from capture, upload it
        if (resultData.imageUrl.startsWith('data:')) {
          const response = await fetch(resultData.imageUrl);
          const blob = await response.blob();
          const fileName = `plant_${user.id}_${Date.now()}.jpeg`;
          await supabaseService.uploadPlantImage(blob, fileName, user.id);
          finalImageUrl = supabaseService.getPublicImageUrl(`${user.id}/${fileName}`);
        }

        await addPlant({
          ...resultData,
          imageUrl: finalImageUrl,
          latitude: coordinates?.lat,
          longitude: coordinates?.lng
        });
        onPlantAdded();
      } catch (err) {
        setError(err instanceof Error ? err.message : t("failedToAddPlant"));
      } finally {
        setIsLoading(false);
      }
    } else if (!user) {
      setError(t("errorUserNotLoggedIn"));
    }
  };

  const handlePlaceholderClick = () => {
    if (!isCameraActive) {
      startCamera();
    }
  }

  return (
    <div className="p-4 pb-20">
      <button onClick={onBack} className="flex items-center text-green-600 font-semibold mb-4">
        <i className="fa-solid fa-arrow-left mr-2"></i>
        {t('back')}
      </button>
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-green-800 mb-2 text-center">{t('addNewPlant')}</h1>

        <p className="text-gray-500 mb-4 text-center">{t('identifyByCamera')}</p>

        <canvas ref={canvasRef} className="hidden"></canvas>

        <div
          className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 cursor-pointer mb-4 relative overflow-hidden"
          onClick={handlePlaceholderClick}
        >
          {isCameraActive ? (
            <>
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <button onClick={handleCapture} className="absolute bottom-4 w-16 h-16 bg-white rounded-full border-4 border-green-500 focus:outline-none z-10" aria-label="Capture photo"></button>
            </>
          ) : imagePreview ? (
            <img src={imagePreview} alt="Plant preview" className="w-full h-full object-cover rounded-lg" />
          ) : (
            <div className="text-gray-400 text-center">
              <i className="fa-solid fa-camera text-5xl"></i>
              <p className="mt-2">{t('tapToStartCamera')}</p>
            </div>
          )}
        </div>

        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="flex-shrink mx-4 text-gray-400 font-semibold">{t('or')}</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <p className="text-gray-500 mb-4 text-center">{t('addByName')}</p>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:outline-none"
            disabled={isSearching || isLoading || isCameraActive}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={isSearching || isLoading || isCameraActive}
            className="px-4 py-3 bg-green-500 text-white font-bold rounded-lg shadow-md hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            aria-label={t('search')}
          >
            {isSearching ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-search"></i>}
          </button>
        </div>


        <div className="mt-6 min-h-[5rem]">
          {isLoading && <Spinner text={isCameraActive ? t('startingCamera') : t('analyzingImage')} />}
          {isSearching && <Spinner text={t('searchingForPlant')} />}
          {error && <p className="text-red-500 bg-red-100 p-3 rounded-lg text-center">{error}</p>}

          {resultData && (
            <div className="text-left mt-6 animate-fade-in">
              <h2 className="text-xl font-bold">{resultData.name}</h2>
              <p className="text-gray-600 mt-2">{resultData.description}</p>
              <div className="mt-4 bg-green-50 p-3 rounded-lg">
                <h3 className="font-semibold text-green-800">{t('careNeeds')}</h3>
                <p className="text-sm text-green-700">{resultData.careNeeds}</p>
              </div>

              {plantExists(resultData.name) ? (
                <div className="mt-6 text-center p-3 bg-yellow-100 text-yellow-800 rounded-lg">
                  <i className="fa-solid fa-check-circle mr-2"></i>
                  {t('alreadyInGarden')}
                </div>
              ) : (
                <button
                  onClick={handleAddPlant}
                  className="w-full mt-6 py-3 bg-green-500 text-white font-bold rounded-lg shadow-md hover:bg-green-600 transition-colors"
                >
                  <i className="fa-solid fa-plus mr-2"></i>
                  {t('addToGarden')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
