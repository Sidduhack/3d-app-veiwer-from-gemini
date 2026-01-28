import React, { useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import SceneContent from './components/SceneContent';
import UIOverlay from './components/UIOverlay';
import ErrorBoundary from './components/ErrorBoundary';
import { loadScene, isModelFile, createResourceMap, revokeResourceMap } from './services/loaderService';
import { ViewerSettings, QualityLevel, LoadedModel } from './types';

function App() {
  // Mobile check for initial settings
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const [settings, setSettings] = useState<ViewerSettings>({
    quality: isMobile ? QualityLevel.LOW : QualityLevel.HIGH,
    environment: 'studio',
    gridVisible: true,
    autoRotate: false,
    fov: 45,
    exposure: 1.0,
    energySaver: isMobile,
  });

  const [model, setModel] = useState<LoadedModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [captureTrigger, setCaptureTrigger] = useState(0);

  // Incremental Loading State
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [resources, setResources] = useState<Record<string, string>>({});

  // File Drop Handler
  const handleDrop = useCallback(async (e: React.DragEvent | Event | React.ChangeEvent<HTMLInputElement>) => {
    // Prevent defaults for drag events
    if (e.type === 'drop' || e.type === 'dragover') {
        e.preventDefault();
        e.stopPropagation();
    }

    // Reset UI error
    setError(null);
    setLoading(true);

    let droppedFiles: File[] = [];
    
    // EXTRACT FILES: Robust handling for both Drag Events and Input Change Events
    // 1. React Synthetic DragEvent or Native DragEvent
    if ('dataTransfer' in e && e.dataTransfer) {
       if (e.dataTransfer.items) {
           for (let i = 0; i < e.dataTransfer.items.length; i++) {
               const item = e.dataTransfer.items[i];
               if (item.kind === 'file') {
                   const file = item.getAsFile();
                   if (file) droppedFiles.push(file);
               }
           }
       } else if (e.dataTransfer.files) {
           droppedFiles = Array.from(e.dataTransfer.files);
       }
    } 
    // 2. React ChangeEvent or Native Input Event
    else if ('target' in e) {
        const target = e.target as HTMLInputElement;
        if (target.files) {
            droppedFiles = Array.from(target.files);
        }
    }

    if (droppedFiles.length === 0) {
        setLoading(false);
        return;
    }

    // Determine strategy: New Model or Add Assets
    const newModelFile = droppedFiles.find(f => isModelFile(f.name));
    
    let activeMainFile = mainFile;
    let activeResources = { ...resources };

    // SCENARIO 1: A new model file is dropped. Reset everything.
    if (newModelFile) {
        // Cleanup old memory
        revokeResourceMap(resources);
        
        // Start fresh
        activeResources = createResourceMap(droppedFiles);
        activeMainFile = newModelFile;
        
        setResources(activeResources);
        setMainFile(activeMainFile);
        setFileName(activeMainFile.name);
    } 
    // SCENARIO 2: Only assets (textures, etc.) dropped. Append to current.
    else {
        if (!activeMainFile) {
            setError("Please drop a 3D model file (GLB, OBJ, FBX) first.");
            setLoading(false);
            return;
        }
        
        // Create blobs for new files and merge
        const newAssets = createResourceMap(droppedFiles);
        activeResources = { ...activeResources, ...newAssets };
        setResources(activeResources);
        
        // We will reload the current model with the new texture map
        console.log("Adding textures/assets to existing model:", newAssets);
    }

    try {
        if (activeMainFile) {
            const loaded = await loadScene(activeMainFile, activeResources);
            setModel(loaded);
        }
    } catch (err: any) {
        setError(err.message || 'Failed to parse model files.');
        console.error(err);
    } finally {
        setLoading(false);
    }
  }, [resources, mainFile]);

  // Prevent default drag behaviors on window
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop as any);
    return () => {
        window.removeEventListener('dragover', handleDragOver);
        window.removeEventListener('drop', handleDrop as any);
    };
  }, [handleDrop]);

  // Specific handler for the hidden input to ensure it clears after selection
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleDrop(e);
        // CRITICAL: Clear the input value so the same file can be selected again if needed
        e.target.value = '';
      }
  };

  const handleCapture = () => {
      setCaptureTrigger(prev => prev + 1);
  };

  const dpr = settings.energySaver ? 1 : (settings.quality === QualityLevel.HIGH ? 2 : 1.5);

  return (
    <div className="w-full h-screen bg-neutral-900 relative overflow-hidden select-none">
      
      <UIOverlay 
        settings={settings}
        setSettings={setSettings}
        onCapture={handleCapture}
        isLoading={loading}
        onOpen={() => document.getElementById('fileInput')?.click()}
        onFileSelect={handleFileInput}
        fileName={fileName}
        error={error}
        onClearError={() => setError(null)}
      />

      <ErrorBoundary fallback={(err) => <div className="text-white p-10">Critical Render Error: {err.message}</div>}>
        <Canvas
            shadows={!settings.energySaver && settings.quality !== QualityLevel.LOW}
            dpr={dpr}
            gl={{ 
                preserveDrawingBuffer: true,
                antialias: settings.quality !== QualityLevel.LOW,
                alpha: true
            }}
            camera={{ position: [5, 5, 5], fov: settings.fov }}
            className="w-full h-full block"
        >
            <SceneContent 
                model={model} 
                settings={settings}
                captureTrigger={captureTrigger}
                onCaptureComplete={() => setCaptureTrigger(0)}
            />
        </Canvas>
      </ErrorBoundary>
      
      <Loader 
        containerStyles={{ backgroundColor: '#050505', zIndex: 50 }}
        innerStyles={{ width: '200px', height: '10px', backgroundColor: '#333' }}
        barStyles={{ backgroundColor: '#3b82f6', height: '10px' }}
        dataInterpolation={(p) => `Loading ${p.toFixed(0)}%`}
      />
    </div>
  );
}

export default App;