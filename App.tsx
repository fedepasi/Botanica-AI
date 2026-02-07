import React, { useState } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { GardenScreen } from './screens/GardenScreen';
import { AddPlantScreen } from './screens/AddPlantScreen';
import { PlantDetailScreen } from './screens/PlantDetailScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { BottomNav } from './components/BottomNav';
import { LanguageProvider } from './contexts/LanguageContext';
import { CareplanProvider } from './contexts/CareplanContext';
import { Plant, Screen } from './types';

const AppContent: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<Screen>('home');
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);

  const handleSelectPlant = (plant: Plant) => {
    setSelectedPlant(plant);
    setActiveScreen('plantDetail');
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'home':
        return <HomeScreen />;
      case 'garden':
        return <GardenScreen onSelectPlant={handleSelectPlant} onAddPlant={() => setActiveScreen('addPlant')} />;
      case 'addPlant':
        return <AddPlantScreen onBack={() => setActiveScreen('garden')} onPlantAdded={() => setActiveScreen('garden')} />;
      case 'plantDetail':
        return selectedPlant ? <PlantDetailScreen plant={selectedPlant} onBack={() => setActiveScreen('garden')} /> : <GardenScreen onSelectPlant={handleSelectPlant} onAddPlant={() => setActiveScreen('addPlant')} />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <HomeScreen />;
    }
  };

  const showBottomNav = !['addPlant', 'plantDetail'].includes(activeScreen);

  return (
    <div className="font-sans bg-gray-50 min-h-screen">
      <main className="container mx-auto max-w-lg">
        {renderScreen()}
      </main>
      {showBottomNav && (
        <BottomNav activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
      )}
    </div>
  );
}


const App: React.FC = () => {
  return (
    <LanguageProvider>
      <CareplanProvider>
        <AppContent />
      </CareplanProvider>
    </LanguageProvider>
  );
};

export default App;