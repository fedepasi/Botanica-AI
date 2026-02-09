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
    <div className="p-6 pb-24 font-outfit bg-garden-beige min-h-screen">
      <button onClick={onBack} className="flex items-center text-garden-green font-bold mb-8 hover:translate-x-[-4px] transition-transform">
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mr-3 shadow-sm border border-gray-100">
          <i className="fa-solid fa-arrow-left text-sm"></i>
        </div>
        {t('back')}
      </button>

      <div className="bg-white p-8 rounded-[48px] shadow-sm border border-gray-100 mb-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">
            {t('addNewPlant').split(' ')[0]} <span className="highlight-yellow inline-block">{t('addNewPlant').split(' ').slice(1).join(' ')}</span>
          </h1>
          <p className="text-gray-500 mt-2 font-medium italic">{t('identifyByCamera')}</p>
        </div>

        <canvas ref={canvasRef} className="hidden"></canvas>

        <div
          className="w-full h-72 rounded-[40px] flex items-center justify-center bg-garden-beige/50 cursor-pointer mb-8 relative overflow-hidden group border-2 border-dashed border-garden-green/20 hover:border-garden-green/40 transition-all shadow-inner"
          onClick={handlePlaceholderClick}
        >
          {isCameraActive ? (
            <>
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute inset-0 border-8 border-white/20 pointer-events-none rounded-[40px]"></div>
              <button onClick={handleCapture} className="absolute bottom-6 w-20 h-20 bg-white/30 backdrop-blur-md rounded-full border-4 border-white flex items-center justify-center group focus:outline-none z-10 hover:scale-110 active:scale-95 transition-all shadow-xl" aria-label="Capture photo">
                <div className="w-14 h-14 bg-white rounded-full"></div>
              </button>
            </>
          ) : imagePreview ? (
            <div className="w-full h-full relative">
              <img src={imagePreview} alt="Plant preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/10"></div>
              {!isLoading && (
                <button className="absolute inset-0 flex items-center justify-center group" onClick={startCamera}>
                  <div className="w-16 h-16 bg-white/80 rounded-full flex items-center justify-center text-garden-green shadow-xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                    <i className="fa-solid fa-rotate-right text-2xl"></i>
                  </div>
                </button>
              )}
            </div>
          ) : (
            <div className="text-center group-hover:scale-110 transition-transform duration-300">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm text-garden-green/40 group-hover:text-garden-green transition-colors">
                <i className="fa-solid fa-camera text-3xl"></i>
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-garden-green/60">{t('tapToStartCamera')}</p>
            </div>
          )}
          {isLoading && !isCameraActive && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-20">
              <Spinner text={t('analyzingImage')} />
            </div>
          )}
        </div>

        <div className="relative flex py-6 items-center">
          <div className="flex-grow border-t border-gray-100"></div>
          <span className="flex-shrink mx-6 text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">{t('or')}</span>
          <div className="flex-grow border-t border-gray-100"></div>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-black uppercase tracking-widest text-garden-green/60 text-center">{t('addByName')}</p>
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="flex-grow p-5 bg-garden-beige/30 border-2 border-transparent placeholder-gray-400 text-gray-900 rounded-3xl focus:outline-none focus:bg-white focus:border-garden-yellow transition-all font-medium text-sm"
              disabled={isSearching || isLoading || isCameraActive}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || isLoading || isCameraActive}
              className="w-16 h-16 bg-garden-green text-white rounded-3xl shadow-lg shadow-garden-green/20 hover:scale-105 active:scale-95 transition-all disabled:bg-gray-200 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center"
              aria-label={t('search')}
            >
              {isSearching ? <i className="fa-solid fa-circle-notch animate-spin text-xl"></i> : <i className="fa-solid fa-magnifying-glass text-xl"></i>}
            </button>
          </div>
        </div>

        <div className="mt-8">
          {error && (
            <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-center text-sm font-bold border border-red-100 animate-shake">
              {error}
            </div>
          )}

          {resultData && (
            <div className="text-left mt-8 p-6 bg-garden-beige/30 border border-garden-green/5 rounded-[32px] animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">{resultData.name}</h2>
                <div className="w-8 h-8 rounded-full bg-garden-green/10 flex items-center justify-center text-garden-green">
                  <i className="fa-solid fa-leaf text-xs"></i>
                </div>
              </div>
              <p className="text-gray-600 font-medium italic text-sm leading-relaxed mb-6">{resultData.description}</p>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-50 mb-8">
                <h3 className="font-black text-xs uppercase tracking-widest text-garden-green mb-2">{t('careNeeds')}</h3>
                <p className="text-sm text-gray-700 font-medium">{resultData.careNeeds}</p>
              </div>

              {plantExists(resultData.name) ? (
                <div className="text-center p-4 bg-white/60 border border-garden-yellow rounded-2xl text-gray-900 font-bold text-xs uppercase tracking-widest shadow-sm">
                  <i className="fa-solid fa-check-circle mr-2 text-garden-green"></i>
                  {t('alreadyInGarden')}
                </div>
              ) : (
                <button
                  onClick={handleAddPlant}
                  className="w-full py-5 bg-garden-green text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl shadow-garden-green/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center"
                >
                  <i className="fa-solid fa-plus mr-3 text-lg"></i>
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
