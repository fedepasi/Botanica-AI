import React, { useState, Component, ErrorInfo, ReactNode } from 'react';
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

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
            <i className="fa-solid fa-triangle-exclamation text-4xl text-yellow-500 mb-4"></i>
            <h1 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h1>
            <p className="text-gray-500 mb-4">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-green-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-green-600 transition"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <CareplanProvider>
            <AppContent />
          </CareplanProvider>
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;