import React, { useEffect } from 'react';
import useLocationStore from '../store/useLocationStore';
import { LocateFixed, Locate, Compass, Gauge } from 'lucide-react';

const GpsOverlay = ({ onCenterRequest }) => {
  const { position, heading, speed, accuracy, isTracking, startTracking, stopTracking, error } = useLocationStore();

  const handleToggleTracking = () => {
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
    <div className="absolute bottom-24 md:bottom-10 left-6 z-[1000] flex flex-col items-start gap-4">
      
      {/* Vitesse & Boussole Haute Couture */}
      {(speed !== null && speed > 1) && (
        <div className="bg-zinc-950/60 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 flex gap-6 shadow-2xl mb-2 animate-spring-up overflow-hidden relative">
          <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />
          <div className="flex flex-col items-center justify-center relative z-10">
            <span className="text-3xl font-black text-white leading-none tracking-tighter">{Math.round(speed * 3.6)}</span>
            <span className="text-[8px] text-zinc-500 uppercase tracking-[0.3em] font-black mt-1">KM/H</span>
          </div>
          <div className="w-px bg-white/10 relative z-10"></div>
          {heading !== null && (
            <div className="flex flex-col items-center justify-center relative z-10">
              <Compass 
                className="text-white mb-1 transition-transform duration-500" 
                size={24} 
                style={{ transform: `rotate(${heading}deg)` }} 
              />
              <span className="text-[8px] text-zinc-500 uppercase tracking-[0.3em] font-black">{Math.round(heading)}°</span>
            </div>
          )}
        </div>
      )}

      {/* Contrôles GPS flottants */}
      <div className="flex flex-col gap-3">
        <button
          onClick={handleToggleTracking}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-500 border backdrop-blur-3xl group ${isTracking ? 'bg-blue-600 text-white border-blue-400 shadow-blue-500/40 scale-110' : 'bg-zinc-950/60 text-zinc-400 border-white/10 hover:text-white hover:bg-zinc-900'}`}
          title={isTracking ? "Arrêter le suivi GPS" : "Démarrer le suivi GPS"}
        >
          {isTracking ? <LocateFixed size={24} className="animate-pulse" /> : <Locate size={24} className="group-hover:scale-110 transition-transform" />}
        </button>
        
        {isTracking && position && (
          <button
            onClick={handleRecenter}
            className="w-12 h-12 rounded-2xl bg-zinc-900/80 text-white flex items-center justify-center shadow-2xl border border-white/5 hover:bg-zinc-800 transition-all backdrop-blur-3xl animate-spring-up"
            title="Recentrer sur ma position"
          >
            <LocateFixed size={20} />
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] px-4 py-2 rounded-xl backdrop-blur-2xl font-black uppercase tracking-widest shadow-2xl">
          {error}
        </div>
      )}
    </div>
  );
};

export default GpsOverlay;
