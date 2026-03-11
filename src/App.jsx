import React, { useState, useEffect } from 'react';
import { Milestone, Map as MapIcon, Loader2, Download } from 'lucide-react';
import MapContainer from './components/MapContainer';
import ElevationProfile from './components/ElevationProfile';
import SearchPanel from './features/routing/SearchPanel';
import WeatherTimeline from './features/weather/WeatherTimeline';
import useRouteStore from './store/useRouteStore';

function App() {
  const { routes, activeRouteIndex, weatherPoints, elevationPoints, totalAscent, loading, status, weatherAlerts, exportGPX, calculateRouteDetails } = useRouteStore();
  const activeRoute = routes[activeRouteIndex];

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-slate-950 text-slate-200 overflow-hidden font-sans relative">
      {/* Sidebar */}
      <aside className="w-full md:w-96 bg-slate-900/95 backdrop-blur-3xl border-b md:border-b-0 md:border-r border-white/10 p-4 md:p-5 flex flex-col z-30 shadow-[0_10px_30px_rgba(0,0,0,0.5)] md:shadow-[10px_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden h-[55vh] md:h-full flex-shrink-0">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-slate-800 rounded-lg text-slate-200 border border-white/5 shadow-inner">
            <Milestone size={22} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-widest leading-none">
              METEOMAP <span className="text-slate-500 font-light">PRO</span>
            </h1>
            <p className="text-[9px] text-slate-500 uppercase tracking-[0.4em] font-bold mt-1">
              Grey Elegant Edition
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-6 custom-scrollbar">
          <SearchPanel />

        {status && (
          <div className="mt-2 p-4 bg-slate-800/30 border border-white/5 rounded-lg flex items-center gap-3 text-[10px] font-bold text-slate-400 animate-pulse">
             <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
             {status}
          </div>
        )}

        {activeRoute && weatherPoints.length > 0 && (
          <div className="mt-2 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             
             {weatherAlerts && weatherAlerts.length > 0 && (
              <div className="space-y-2">
                {weatherAlerts.map((alert, idx) => (
                  <div key={idx} className="bg-red-950/40 border border-red-500/20 text-red-400 p-3 flex drop-shadow-md rounded-lg text-xs font-bold items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0"></div>
                    {alert}
                  </div>
                ))}
              </div>
             )}

             <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/60 p-4 rounded-lg border border-white/5">
                   <div className="text-[9px] text-slate-500 uppercase font-black mb-1.5 tracking-widest">Distance</div>
                   <div className="text-sm font-black text-slate-200 tracking-tight">{(activeRoute.distance / 1000).toFixed(1)} <span className="text-[9px] text-slate-500">KM</span></div>
                </div>
                <div className="bg-slate-950/60 p-4 rounded-lg border border-white/5">
                   <div className="text-[9px] text-slate-500 uppercase font-black mb-1.5 tracking-widest">Durée</div>
                   <div className="text-sm font-black text-slate-200 tracking-tight">{Math.floor(activeRoute.duration / 60)} <span className="text-[9px] text-slate-500">MIN</span></div>
                </div>
             </div>

             <button onClick={exportGPX} className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-white/10 flex items-center justify-center gap-2 transition-colors shadow-inner">
                 <Download size={14} /> <span className="text-[10px] font-black uppercase tracking-widest">Exporter le tracé (GPX)</span>
             </button>

             <ElevationProfile points={elevationPoints} totalAscent={totalAscent} />

             <WeatherTimeline weatherPoints={weatherPoints} />
          </div>
        )}
        </div>

        <div className="mt-auto border-t border-white/5 p-5 pt-6 bg-slate-900/95 sticky bottom-0">
          <div className="flex items-center gap-3 text-[9px] text-slate-600 font-black uppercase tracking-[0.3em]">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-pulse"></div>
            METEOMAP SECURE SESSION
          </div>
        </div>
      </aside>

      {/* Main Map Area */}
      <main className="flex-1 relative bg-slate-950">
        <MapContainer 
          routes={routes} 
          activeRouteIndex={activeRouteIndex} 
          onRouteSelect={calculateRouteDetails} 
          weatherPoints={weatherPoints} 
        />
        {!activeRoute && !loading && (
          <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center p-12 text-center">
            <div className="max-w-md bg-slate-900/60 backdrop-blur-xl p-10 rounded-xl border border-white/10 space-y-6 shadow-2xl transform hover:scale-[1.01] transition-transform duration-500">
               <div className="w-16 h-16 bg-white/5 rounded-lg flex items-center justify-center text-slate-400 mx-auto border border-white/5">
                  <MapIcon size={28} strokeWidth={1} />
               </div>
               <div className="space-y-2">
                 <h2 className="text-xl font-black text-white tracking-widest uppercase">SYSTÈME PRÊT</h2>
                 <p className="text-xs text-slate-500 leading-relaxed font-semibold uppercase tracking-tight">Veuillez définir vos coordonnées pour initialiser l'analyse climat-trajet.</p>
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
