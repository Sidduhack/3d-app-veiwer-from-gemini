import React, { useState } from 'react';
import { Settings, Aperture, Camera, Grid, Sun, Moon, Battery, Box, AlertTriangle, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { ViewerSettings, QualityLevel } from '../types';

interface UIOverlayProps {
  settings: ViewerSettings;
  setSettings: React.Dispatch<React.SetStateAction<ViewerSettings>>;
  onCapture: () => void;
  isLoading: boolean;
  onOpen: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileName?: string;
  error?: string | null;
  onClearError: () => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ 
  settings, 
  setSettings, 
  onCapture, 
  isLoading, 
  onOpen,
  onFileSelect,
  fileName,
  error,
  onClearError
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleSetting = (key: keyof ViewerSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateSetting = (key: keyof ViewerSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const environments = ['studio', 'city', 'sunset', 'night', 'park', 'lobby'];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between z-10">
      
      {/* Hidden Global File Input */}
      <input 
        type="file" 
        id="fileInput" 
        multiple 
        className="hidden" 
        onChange={onFileSelect}
        title="Open Files"
      />

      {/* Header / Top Bar */}
      <div className="flex justify-between items-start p-6 pointer-events-auto">
        <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-md flex items-center gap-2">
                <Box className="w-6 h-6 text-accent" />
                OmniView 3D <span className="text-accent text-sm bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">PRO</span>
            </h1>
            {fileName && <span className="text-gray-400 text-xs mt-1 ml-8">{fileName}</span>}
        </div>

        {/* Energy Mode Indicator */}
        <button 
          onClick={() => toggleSetting('energySaver')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border transition-all ${settings.energySaver ? 'bg-green-900/40 border-green-500/30 text-green-400' : 'bg-glass border-glass-border text-gray-400'}`}
        >
          <Battery className="w-4 h-4" />
          <span className="text-xs font-medium">{settings.energySaver ? 'Eco On' : 'Eco Off'}</span>
        </button>
      </div>

      {/* Center - Loading / Error */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {isLoading && (
           <div className="bg-black/80 backdrop-blur-xl p-6 rounded-2xl border border-white/10 flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <Loader2 className="w-10 h-10 text-accent animate-spin mb-3" />
              <p className="text-sm text-gray-300">Processing Assets...</p>
           </div>
        )}
        
        {error && (
            <div className="bg-red-900/90 backdrop-blur-xl p-6 max-w-sm rounded-2xl border border-red-500/30 pointer-events-auto shadow-2xl">
                <div className="flex items-center gap-3 mb-2 text-red-200">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-semibold">Failed to Load</span>
                </div>
                <p className="text-sm text-red-100/80 mb-4">{error}</p>
                <button 
                    onClick={onClearError}
                    className="w-full py-2 bg-red-950/50 hover:bg-red-900/50 rounded-lg text-xs uppercase tracking-wider font-bold transition-colors"
                >
                    Dismiss
                </button>
            </div>
        )}
        
        {!fileName && !isLoading && !error && (
            <div className="text-center opacity-40 pointer-events-none">
                <div className="border-2 border-dashed border-white/20 w-64 h-48 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl text-white/20">+</span>
                </div>
                <p className="text-lg font-light">Drag & Drop 3D Files</p>
                <p className="text-xs text-gray-400 mt-1">GLB, GLTF, OBJ, FBX, STL</p>
            </div>
        )}
      </div>

      {/* Settings Drawer (Right Side) */}
      <div className={`absolute top-0 right-0 h-full w-80 bg-glass backdrop-blur-xl border-l border-glass-border transform transition-transform duration-300 ease-in-out pointer-events-auto overflow-y-auto ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold">Adjustments</h2>
                <button onClick={() => setDrawerOpen(false)} className="hover:text-accent transition-colors"><X className="w-5 h-5" /></button>
            </div>

            {/* Quality Section */}
            <div className="space-y-3">
                <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Render Quality</label>
                <div className="grid grid-cols-3 gap-2">
                    {Object.values(QualityLevel).map((q) => (
                        <button 
                            key={q}
                            onClick={() => updateSetting('quality', q)}
                            className={`py-2 text-xs rounded-lg border transition-all ${settings.quality === q ? 'bg-accent text-white border-accent' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                        >
                            {q}
                        </button>
                    ))}
                </div>
            </div>

             {/* Environment Section */}
             <div className="space-y-3">
                <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Lighting Studio</label>
                <div className="grid grid-cols-2 gap-2">
                    {environments.map((env) => (
                        <button 
                            key={env}
                            onClick={() => updateSetting('environment', env)}
                            className={`py-2 text-xs rounded-lg border capitalize transition-all ${settings.environment === env ? 'bg-white/20 border-white/30 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                        >
                            {env}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sliders */}
            <div className="space-y-6">
                 <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-400">
                        <span>Exposure</span>
                        <span>{settings.exposure.toFixed(1)}</span>
                    </div>
                    <input 
                        type="range" min="0.1" max="3" step="0.1" 
                        value={settings.exposure}
                        onChange={(e) => updateSetting('exposure', parseFloat(e.target.value))}
                        className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    />
                 </div>
                 
                 <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-400">
                        <span>Field of View</span>
                        <span>{settings.fov}</span>
                    </div>
                    <input 
                        type="range" min="10" max="90" step="1" 
                        value={settings.fov}
                        onChange={(e) => updateSetting('fov', parseFloat(e.target.value))}
                        className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    />
                 </div>
            </div>
        </div>
      </div>

      {/* Bottom Bar Controls */}
      <div className="p-6 pointer-events-auto flex justify-center">
        <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl px-6 py-3 flex items-center gap-6 shadow-2xl">
           
           <button onClick={onOpen} className="flex flex-col items-center gap-1 group text-gray-400 hover:text-white transition-colors">
               <div className="p-2 rounded-xl bg-white/5 group-hover:bg-accent/20 transition-colors">
                   <ImageIcon className="w-5 h-5" />
               </div>
               <span className="text-[10px] font-medium">Open</span>
           </button>

           <div className="w-px h-8 bg-white/10"></div>

           <button onClick={() => toggleSetting('gridVisible')} className={`flex flex-col items-center gap-1 group transition-colors ${settings.gridVisible ? 'text-accent' : 'text-gray-400 hover:text-white'}`}>
               <div className={`p-2 rounded-xl bg-white/5 transition-colors ${settings.gridVisible ? 'bg-accent/20' : ''}`}>
                   <Grid className="w-5 h-5" />
               </div>
               <span className="text-[10px] font-medium">Grid</span>
           </button>

           <button onClick={() => toggleSetting('autoRotate')} className={`flex flex-col items-center gap-1 group transition-colors ${settings.autoRotate ? 'text-accent' : 'text-gray-400 hover:text-white'}`}>
               <div className={`p-2 rounded-xl bg-white/5 transition-colors ${settings.autoRotate ? 'bg-accent/20' : ''}`}>
                   <Aperture className="w-5 h-5" />
               </div>
               <span className="text-[10px] font-medium">Spin</span>
           </button>

           <div className="w-px h-8 bg-white/10"></div>

           <button onClick={onCapture} className="flex flex-col items-center gap-1 group text-gray-400 hover:text-white transition-colors">
               <div className="p-2 rounded-xl bg-white/5 group-hover:bg-white/20 transition-colors">
                   <Camera className="w-5 h-5" />
               </div>
               <span className="text-[10px] font-medium">4K Shot</span>
           </button>

            <button onClick={() => setDrawerOpen(true)} className="flex flex-col items-center gap-1 group text-gray-400 hover:text-white transition-colors">
               <div className="p-2 rounded-xl bg-white/5 group-hover:bg-white/20 transition-colors">
                   <Settings className="w-5 h-5" />
               </div>
               <span className="text-[10px] font-medium">Tune</span>
           </button>

        </div>
      </div>

    </div>
  );
};

export default UIOverlay;