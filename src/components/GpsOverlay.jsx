import React, { useEffect } from 'react';
import useLocationStore from '../store/useLocationStore';
import { LocateFixed, Locate, Compass, Gauge } from 'lucide-react';

const GpsOverlay = ({ onCenterRequest }) => {
  const { position, heading, speed, accuracy, isTracking, startTracking, stopTracking, error } = useLocationStore();

  // Démarrer le tracking au montage si on le souhaite (ou laisser l'utilisateur cliquer)
  /* useEffect(() => {
    startTracking();
    return () => stopTracking();
  }, []); */

  const handleToggleTracking = () => {
    console.log("🔥 BOUTON GPS CLIQUÉ !", { isTracking, navGeo: !!navigator.geolocation });
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  };

  const handleRecenter = () => {
    if (position && onCenterRequest) {
      onCenterRequest(position);
    }
  };

  return (
    <div className="absolute bottom-6 md:bottom-10 left-3 md:left-6 z-[1000] flex flex-col items-start gap-2">
      
      {/* Vitesse & Boussole (Si en mouvement) */}
      {(speed !== null && speed > 1) && (
        <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-xl p-3 flex gap-4 shadow-xl mb-2 animate-in slide-in-from-left-2">
          <div className="flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-white leading-none">{Math.round(speed * 3.6)}</span>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">KM/H</span>
          </div>
          <div className="w-px bg-white/10"></div>
          {heading !== null && (
            <div className="flex flex-col items-center justify-center">
              <Compass 
                className="text-white mb-1 transition-transform duration-500" 
                size={20} 
                style={{ transform: `rotate(${heading}deg)` }} 
              />
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">{Math.round(heading)}°</span>
            </div>
          )}
        </div>
      )}

      {/* Message d'erreur GPS */}
      {error && (
        <div className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs px-3 py-1.5 rounded-md backdrop-blur-md font-medium">
          {error}
        </div>
      )}

      {/* Contrôles GPS */}
      <div className="flex flex-col gap-2">
        <button
          onClick={handleToggleTracking}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 border backdrop-blur-md ${isTracking ? 'bg-blue-600/90 text-white border-blue-400/50 shadow-blue-500/20' : 'bg-slate-900/90 text-slate-400 border-white/10 hover:text-white'}`}
          title={isTracking ? "Arrêter le suivi GPS" : "Démarrer le suivi GPS"}
        >
          {isTracking ? <LocateFixed size={22} className="animate-pulse" /> : <Locate size={22} />}
        </button>
        
        {isTracking && position && (
          <button
            onClick={handleRecenter}
            className="w-10 h-10 ml-1 rounded-full bg-slate-800/80 text-white flex items-center justify-center shadow-lg border border-white/10 hover:bg-slate-700 transition-colors backdrop-blur-md animate-in slide-in-from-bottom-2"
            title="Recentrer sur ma position"
          >
            <LocateFixed size={18} />
          </button>
        )}
      </div>
      
    </div>
  );
};

export default GpsOverlay;
