import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { Play, Pause, SkipForward, SkipBack } from 'lucide-react';

const RainRadar = ({ map, enabled }) => {
  const [radarData, setRadarData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const tileLayerRef = useRef(null);
  const [host, setHost] = useState(null);

  // Fetch RainViewer host and timestamps
  useEffect(() => {
    const fetchRadarInfo = async () => {
      try {
        const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        const data = await response.json();
        if (data && data.radar && data.radar.past && data.radar.nowcast) {
          const frames = [...data.radar.past, ...data.radar.nowcast];
          setRadarData(frames);
          setHost(data.host);
          setCurrentIndex(data.radar.past.length - 1); // Start at "now"
        }
      } catch (error) {
        console.error("RainViewer API Error:", error);
      }
    };
    fetchRadarInfo();
  }, []);

  // Sync Leaflet Layer
  useEffect(() => {
    if (!map || !enabled || !radarData || !host) {
      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
        tileLayerRef.current = null;
      }
      return;
    }

    const currentFrame = radarData[currentIndex];
    const url = `${host}${currentFrame.path}/256/{z}/{x}/{y}/2/1_1.png`;

    if (!tileLayerRef.current) {
      tileLayerRef.current = L.tileLayer(url, {
        opacity: 0.6,
        zIndex: 100,
        attribution: 'Radar &copy; RainViewer'
      }).addTo(map);
    } else {
      tileLayerRef.current.setUrl(url);
    }

  }, [map, enabled, radarData, currentIndex, host]);

  // Animation logic
  useEffect(() => {
    let interval;
    if (isPlaying && enabled && radarData) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % radarData.length);
      }, 800);
    }
    return () => clearInterval(interval);
  }, [isPlaying, enabled, radarData]);

  if (!enabled || !radarData) return null;

  const currentFrame = radarData[currentIndex];
  const timestamp = new Date(currentFrame.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isFuture = currentIndex >= (radarData.length - radarData.length / 4);

  return (
    <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-2 pointer-events-auto">
      <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl flex flex-col gap-3 min-w-[200px]">
        <div className="flex items-center justify-between">
          <h4 className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Radar Précipitations</h4>
          <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isFuture ? 'bg-orange-500/10 text-orange-400' : 'bg-slate-800 text-slate-400'}`}>
            {isFuture ? 'PRÉVISION' : 'RÉEL'}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
           <div className="flex-1">
              <div className="text-[12px] font-black text-white tabular-nums">{timestamp}</div>
              <div className="text-[7px] text-slate-500 font-bold uppercase mt-0.5 tracking-tighter">
                {currentIndex + 1} / {radarData.length} frames
              </div>
           </div>
           
           <div className="flex items-center gap-1">
             <button 
                onClick={() => setCurrentIndex(prev => (prev - 1 + radarData.length) % radarData.length)}
                className="p-1.5 hover:bg-white/5 rounded text-slate-400"
             >
               <SkipBack size={12} />
             </button>
             <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
             >
               {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
             </button>
             <button 
                onClick={() => setCurrentIndex(prev => (prev + 1) % radarData.length)}
                className="p-1.5 hover:bg-white/5 rounded text-slate-400"
             >
               <SkipForward size={12} />
             </button>
           </div>
        </div>

        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-400 transition-all duration-300" 
            style={{ width: `${((currentIndex + 1) / radarData.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default RainRadar;
