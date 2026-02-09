import React, { useState } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { GardenScreen } from './screens/GardenScreen';
import { AddPlantScreen } from './screens/AddPlantScreen';
import { PlantDetailScreen } from './screens/PlantDetailScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ChatScreen } from './screens/ChatScreen';
import { AuthScreen } from './screens/AuthScreen';
import { BottomNav } from './components/BottomNav';
import { LanguageProvider } from './contexts/LanguageContext';
import { CareplanProvider } from './contexts/CareplanContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Plant, Screen } from './types';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeScreen, setActiveScreen] = useState<Screen>('home');
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);

  const handleSelectPlant = (plant: Plant) => {
    setSelectedPlant(plant);
    setActiveScreen('plantDetail');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <i className="fa-solid fa-leaf text-4xl text-green-600 animate-pulse"></i>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const renderScreen = () => {
    switch (activeScreen) {
      case 'home':
        return <HomeScreen />;
      case 'garden':
        return <GardenScreen onSelectPlant={handleSelectPlant} onAddPlant={() => setActiveScreen('addPlant')} />;
      case 'addPlant':
        return <AddPlantScreen onBack={() => setActiveScreen('garden')} onPlantAdded={() => setActiveScreen('garden')} />;
      case 'chat':
        return <ChatScreen />;
      case 'plantDetail':
        return selectedPlant ? <PlantDetailScreen plant={selectedPlant} onBack={() => setActiveScreen('garden')} /> : <GardenScreen onSelectPlant={handleSelectPlant} onAddPlant={() => setActiveScreen('addPlant')} />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <main className="pb-20 min-h-screen bg-garden-beige font-outfit">
      {renderScreen()}
      <BottomNav activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
    </main>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <CareplanProvider>
          <AppContent />
        </CareplanProvider>
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;