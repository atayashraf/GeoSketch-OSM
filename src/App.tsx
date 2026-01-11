import React, { useEffect } from 'react';
import { MapView } from './components/MapView';
import { Toolbar } from './components/Toolbar';
import { ExportButton } from './components/ExportButton';
import { ImportButton } from './components/ImportButton';
import { ToastContainer } from './components/Toast';
import { useFeatureStore } from './store/featureStore';
import './App.css';

const App: React.FC = () => {
  const undo = useFeatureStore((state) => state.undo);
  const redo = useFeatureStore((state) => state.redo);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return (
    <div className="app">
      <Toolbar />
      <main className="main-content">
        <MapView />
        <div className="export-container">
          <ImportButton />
          <ExportButton />
        </div>
      </main>
      <ToastContainer />
    </div>
  );
};

export default App;
