import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Milestone, Map as MapIcon, Globe, Loader2, Download, User, LogOut, Library, Zap, MessageSquare, Sparkles } from 'lucide-react';
import MapContainer from './components/MapContainer';
import ElevationProfile from './components/ElevationProfile';
import SearchPanel from './features/routing/SearchPanel';
import WeatherTimeline from './features/weather/WeatherTimeline';
import useRouteStore from './store/useRouteStore';
import { getGradeColor, formatDuration } from './utils/WeatherScorer';
import GpsOverlay from './components/GpsOverlay';
import useLocationStore from './store/useLocationStore';
import AuthModal from './components/AuthModal';
import useAuthStore from './store/useAuthStore';
import SaveRouteButton from './components/SaveRouteButton';
import RouteLibrary from './components/RouteLibrary';
import RouteSelector from './components/RouteSelector';
import DiscoveryHub from './components/DiscoveryHub';
import DepartureHeatmap from './components/DepartureHeatmap';
import BottomTabNav from './components/BottomTabNav';
import DesktopNav from './components/DesktopNav';
import SlidePanel from './components/SlidePanel';

function App() {
  const {
    routes,
    activeRouteIndex,
    setActiveRouteIndex,
    routeScores,
    weatherPoints,
    elevationPoints,
    totalAscent,
    routeScore,
    routeBriefing,
    physicAnalysis,
    pois,
    status,
    weatherAlerts,
    exportGPX,
    calculateTimeOptimization
  } = useRouteStore();

  const { user, initialize, signOut, session } = useAuthStore();
  const { routeId } = useParams();
  const syncCloudData = useRouteStore(state => state.syncCloudData);
  
  const [activeTab, setActiveTab] = useState('search'); 
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const mapCenterRef = useRef(null);
  const activeRoute = routes[activeRouteIndex];

  useEffect(() => { initialize(); }, [initialize]);
  
  // Sync Cloud Data when user is logged in
  useEffect(() => {
    if (user) {
      syncCloudData();
    }
  }, [user, syncCloudData]);

  useEffect(() => {
    if (routeId) {
      useRouteStore.getState().loadRouteFromCloud(routeId);
    }
  }, [routeId]);

  const handleCenterMap = (coords) => {
    if (mapCenterRef.current) {
      mapCenterRef.current([coords.lat, coords.lng]);
    }
  };

  return (
    <div className="app-shell">
      {/* 1. Map Layer (Full Background) */}
      <main className="main-content">
        <MapContainer 
          routes={routes} 
          activeRouteIndex={activeRouteIndex}
          onRouteSelect={setActiveRouteIndex}
          weatherPoints={weatherPoints} 
          pois={pois}
          onRegisterCenterFunction={(fn) => mapCenterRef.current = fn}
        />
        
        {/* HUD Overlay Map-relative */}
        <GpsOverlay onCenterRequest={handleCenterMap} />

        {/* Top Header Floating - Repositionné pour éviter l'overlap */}
        <div className="absolute top-4 right-4 z-[1002] hidden md:flex items-center gap-3">
           {user ? (
              <div className="flex items-center gap-3 bg-zinc-950/80 border border-white/10 p-1.5 rounded-2xl backdrop-blur-3xl shadow-2xl">
                <div className="flex items-center gap-3 px-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/20">
                    <User size={16} />
                  </div>
                  <span className="text-[10px] font-black text-zinc-100 uppercase tracking-widest">{user.email.split('@')[0]}</span>
                  <button onClick={signOut} className="p-2 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 rounded-xl transition-all"><LogOut size={16} /></button>
                </div>
              </div>
           ) : (
             <button onClick={() => setIsAuthModalOpen(true)} className="px-6 py-3 glass-pro text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/10 transition-all rounded-2xl bg-zinc-950/60">Se connecter</button>
           )}
        </div>
      </main>

      {/* 2. Interface Layer (Overlays) */}
      
      {/* Panel: Search & Analysis */}
      <SlidePanel 
        title="Expédition" 
        isOpen={activeTab === 'search'} 
        onClose={() => setActiveTab('map')}
      >
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-6 border-b border-white/5">
            <div className="p-2.5 bg-blue-500/10 rounded-2xl text-blue-400 border border-blue-500/20">
              <Milestone className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-sm font-black text-white tracking-[0.2em] leading-none">METEOMAP</h1>
              <p className="text-[8px] text-zinc-500 uppercase tracking-[0.4em] font-bold mt-1">Intelligence Itinérante</p>
            </div>
          </div>

          <SearchPanel />

          {status && (
            <div className="px-4 py-3 bg-blue-500/5 rounded-xl border border-blue-500/10 flex items-center gap-3 text-[10px] font-black text-blue-400 uppercase tracking-widest">
               <Loader2 className="animate-spin" size={12} />
               {status}
            </div>
          )}

          {activeRoute && weatherPoints.length > 0 && (
            <div className="space-y-6 animate-spring-up">
              <RouteSelector routes={routes} activeIndex={activeRouteIndex} scores={routeScores} onSelect={setActiveRouteIndex} />
              <DepartureHeatmap />

              {routeBriefing && (
                <div className="glass-card p-4 relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 opacity-[0.03] rotate-12"><Sparkles size={80} className="text-blue-400" /></div>
                  <div className="flex gap-4">
                    <MessageSquare size={16} className="text-blue-400 mt-1 flex-shrink-0" />
                    <div className="space-y-1.5">
                      <p className="text-[12px] text-zinc-200 font-medium leading-[1.6] italic">"{routeBriefing}"</p>
                      <p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.3em]">Assistant Stratégique</p>
                    </div>
                  </div>
                </div>
              )}

              {weatherAlerts && weatherAlerts.length > 0 && (
                <div className="space-y-2">
                  {weatherAlerts.map((alert, idx) => (
                    <div key={idx} className="bg-red-500/10 border border-red-500/20 text-red-100 p-3.5 rounded-2xl text-[10px] font-bold flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse"></div>
                      {alert}
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="glass-card p-3.5 flex flex-col justify-between min-h-[85px]">
                   <div className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">Météo</div>
                   <div className={`mt-auto text-xl font-black rounded-xl border px-2.5 py-1 text-center ${routeScore ? getGradeColor(routeScore.grade) : 'text-zinc-500 border-zinc-100/10'}`}>
                      {routeScore ? routeScore.grade : '-'}
                   </div>
                </div>
                <div className="glass-card p-3.5 flex flex-col justify-between min-h-[85px]">
                   <div className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">Temps (Est.)</div>
                   <div className="mt-auto text-xl font-black text-white italic">
                      {physicAnalysis ? formatDuration(physicAnalysis.correctedDuration) : `${Math.round(activeRoute.duration / 60)}min`}
                   </div>
                </div>
                <div className="glass-card p-3.5 flex flex-col justify-between min-h-[85px]">
                   <div className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">Distance</div>
                   <div className="mt-auto text-xl font-black text-white italic">
                      {(activeRoute.distance / 1000).toFixed(1)}<span className="text-xs ml-1 opacity-40">KM</span>
                   </div>
                </div>
                <div className="glass-card p-3.5 flex flex-col justify-between min-h-[85px]">
                   <div className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">D+ Cumulé</div>
                   <div className="mt-auto text-xl font-black text-blue-400 italic">
                      {totalAscent}<span className="text-xs ml-1 opacity-40">M</span>
                   </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={exportGPX} className="flex-1 py-4 glass-pro rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all group">
                   <Download size={14} className="group-hover:scale-110 transition-transform" />
                   Exporter GPX
                </button>
                <SaveRouteButton />
              </div>
            </div>
          )}
        </div>
      </SlidePanel>

      {/* Panels: Other Views */}
      <SlidePanel title="Explorateur" isOpen={activeTab === 'discovery'} onClose={() => setActiveTab('map')}>
        <DiscoveryHub isOpen={true} onClose={() => setActiveTab('map')} hideModalShell={true} />
      </SlidePanel>

      <SlidePanel title="Bibliothèque" isOpen={activeTab === 'library'} onClose={() => setActiveTab('map')}>
        <RouteLibrary isOpen={true} onClose={() => setActiveTab('map')} hideModalShell={true} />
      </SlidePanel>

      {/* 3. Navigation Layer (Bottom/Overlay) */}
      <DesktopNav activeTab={activeTab} onTabChange={setActiveTab} />
      <BottomTabNav activeTab={activeTab} onTabChange={setActiveTab} />

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}

export default App;
