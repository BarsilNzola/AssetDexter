import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Home } from './pages/Home';
import { Dex } from './pages/Dex';
import { Asset } from './pages/Asset';
import { Profile } from './pages/Profile';
import { Web3Provider } from './lib/providers/Web3Provider';
import { QueryProvider } from './lib/providers/QueryProvider';

type Page = 'home' | 'dex' | 'asset' | 'profile';

function AppContent() {
    const [currentPage, setCurrentPage] = useState<Page>('home');
    const [selectedAsset, setSelectedAsset] = useState<any>(null);
  
    // Handle URL hash routing
    useEffect(() => {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('asset/')) {
        setCurrentPage('asset');
      } else if (hash && ['home', 'dex', 'asset', 'profile'].includes(hash)) {
        setCurrentPage(hash as Page);
      }
    }, []);
  
    const handlePageChange = (page: string) => { 
      if (['home', 'dex', 'asset', 'profile'].includes(page)) {
        setCurrentPage(page as Page);
        window.location.hash = page;
      }
    };
  
    const renderPage = () => {
      switch (currentPage) {
        case 'home':
          return <Home onAssetSelect={(asset) => {
            setSelectedAsset(asset);
            window.location.hash = `asset/${asset.id}`;
          }} />;
        case 'dex':
          return <Dex onAssetSelect={(asset) => {
            setSelectedAsset(asset);
            window.location.hash = `asset/${asset.id}`;
          }} />;
        case 'asset':
          return <Asset asset={selectedAsset} onBack={() => {
            setCurrentPage('home');
            window.location.hash = 'home';
          }} />;
        case 'profile':
          return <Profile />;
        default:
          return <Home onAssetSelect={(asset) => {
            setSelectedAsset(asset);
            window.location.hash = `asset/${asset.id}`;
          }} />;
      }
    };
  
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header currentPage={currentPage} onPageChange={handlePageChange} />
        <main className="flex-1 container mx-auto px-4 py-8">
          {renderPage()}
        </main>
        <Footer />
      </div>
    );
}

function App() {
  return (
    <Web3Provider>
      <QueryProvider>
        <AppContent />
      </QueryProvider>
    </Web3Provider>
  );
}

export default App;