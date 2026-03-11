import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Milestone, Map as MapIcon, Loader2, Download, ChevronUp, ChevronDown, User, LogOut, Library } from 'lucide-react';
import MapContainer from './components/MapContainer';
import ElevationProfile from './components/ElevationProfile';
import SearchPanel from './features/routing/SearchPanel';
import WeatherTimeline from './features/weather/WeatherTimeline';
import useRouteStore from './store/useRouteStore';
import { getGradeColor } from './utils/WeatherScorer';
import GpsOverlay from './components/GpsOverlay';
import useLocationStore from './store/useLocationStore';
import AuthModal from './components/AuthModal';
import useAuthStore from './store/useAuthStore';
import SaveRouteButton from './components/SaveRouteButton';
import RouteLibrary from './components/RouteLibrary';

function App() {
  const {
    waypoints,
    route,
    routes,
    activeRouteIndex,
    setActiveRoute,
    weatherPoints,
    elevationPoints,
    totalAscent,
    routeScore,
    pois,
    loading,
    status,
    weatherAlerts,
    exportGPX,
    calculateRouteDetails
  } = useRouteStore();

  const { isTracking, position } = useLocationStore();
  const { user, isInitialized, initialize, signOut } = useAuthStore();
  const { routeId } = useParams();
  
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const mapCenterRef = useRef(null);
  const activeRoute = routes[activeRouteIndex];

  // Re-collapse the panel on mobile when a new route is selected/ready
  useEffect(() => {
    // Close panel on calculation success
    if (routes && routes.length > 0) {
      setIsMobileExpanded(false);
    }
  }, [routes]);

  // Initialisation Authentification Supabase
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Chargement d'un itinéraire partagé depuis Supabase si l'URL contient un ID
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
    <div className="flex h-[100dvh] w-full bg-slate-950 text-slate-200 overflow-hidden font-sans relative">
      {/* Sidebar - Mobile Bottom Sheet / Desktop Left Panel */}
      <aside 
        className={`absolute bottom-0 left-0 right-0 md:relative w-full md:w-96 bg-slate-900/95 backdrop-blur-3xl border-t md:border-t-0 md:border-r border-white/10 p-4 pt-1 md:p-5 flex flex-col z-30 shadow-[0_-15px_40px_rgba(0,0,0,0.5)] md:shadow-[10px_0_30px_rgba(0,0,0,0.5)] overflow-hidden rounded-t-[2rem] md:rounded-none transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex-shrink-0 ${isMobileExpanded ? 'h-[85dvh]' : 'h-[30dvh]'} md:h-full`}
      >
        
        {/* Mobile Drawer Indicator / Handle */}
        <div 
          className="w-full pt-3 pb-4 flex flex-col items-center justify-center md:hidden cursor-pointer flex-shrink-0"
          onClick={() => setIsMobileExpanded(!isMobileExpanded)}
        >
          <div className="w-12 h-1.5 bg-white/20 rounded-full mb-2"></div>
          <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
            {isMobileExpanded ? (
              <><ChevronDown size={14} /> Masquer</>
            ) : (
              <><ChevronUp size={14} /> Déployer</>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4 md:mb-8 flex-shrink-0">
          <div className="p-2 md:p-2.5 bg-slate-800 rounded-lg text-slate-200 border border-white/5 shadow-inner">
            <Milestone className="w-[18px] h-[18px] md:w-[22px] md:h-[22px]" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-black text-white tracking-widest leading-none">
              METEOMAP <span className="text-slate-500 font-light">PRO</span>
            </h1>
            <p className="text-[8px] md:text-[9px] text-slate-500 uppercase tracking-[0.4em] font-bold mt-1">
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

             <div className="grid grid-cols-3 gap-2 md:gap-4">
                <div className="bg-slate-950/60 p-3 rounded-lg border border-white/5 flex flex-col justify-between">
                   <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest leading-tight">Climat &<br/>Relief</div>
                   <div className={`mt-2 text-xl font-black rounded border px-2 py-0.5 self-start ${routeScore ? getGradeColor(routeScore.grade) : 'text-slate-500 border-slate-500/30'}`}>
                      {routeScore ? routeScore.grade : '-'}
                   </div>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-lg border border-white/5 flex flex-col justify-between">
                   <div className="text-[9px] text-slate-500 uppercase font-black mb-1.5 tracking-widest">Distance</div>
                   <div className="text-sm font-black text-slate-200 tracking-tight">{(activeRoute.distance / 1000).toFixed(1)} <span className="text-[8px] text-slate-500">KM</span></div>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-lg border border-white/5 flex flex-col justify-between">
                   <div className="text-[9px] text-slate-500 uppercase font-black mb-1.5 tracking-widest">Durée</div>
                   <div className="text-sm font-black text-slate-200 tracking-tight">{Math.floor(activeRoute.duration / 60)} <span className="text-[8px] text-slate-500">MIN</span></div>
                </div>
             </div>

             <SaveRouteButton onRequireAuth={() => setIsAuthModalOpen(true)} />

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
      <main className="absolute inset-0 md:relative md:flex-1 bg-slate-950 flex flex-col z-0">
        {/* Map Content - 50% hauteur sur mobile, full width sur desktop */}
        <div className={`transition-all duration-300 ease-in-out absolute inset-0 md:static md:flex-1 md:h-full w-full ${isMobileExpanded ? 'h-[55vh]' : 'h-[100vh]'} z-10`}>
          <div className="h-full w-full relative">
            <MapContainer 
              routes={routes} 
              activeRouteIndex={activeRouteIndex}
              onRouteSelect={setActiveRoute}
              weatherPoints={weatherPoints} 
              pois={pois}
              onRegisterCenterFunction={(fn) => mapCenterRef.current = fn}
            />
          </div>
        </div>

        {/* Panneau d'accueil supprimé à la demande de l'utilisateur pour une carte directe */}

        {/* HUD GPS (Toujours visible, par dessus tout) */}
        <GpsOverlay onCenterRequest={handleCenterMap} />

        {/* Bibliothèque et Authentification */}
        {isInitialized && (
          <div className="absolute top-3 left-3 md:top-6 md:left-6 z-[1000] flex gap-2">
            {user && (
              <button
                onClick={() => setIsLibraryOpen(true)}
                className="p-2.5 bg-slate-950/60 hover:bg-slate-800 text-slate-400 border border-white/5 rounded-lg transition-all flex items-center gap-2 group shadow-2xl backdrop-blur-md"
                title="Mes Expéditions"
              >
                <Library size={18} className="group-hover:text-blue-400 transition-colors" />
                <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Mes Expéditions</span>
              </button>
            )}

            <div className="flex items-center gap-2 bg-slate-950/60 border border-white/5 p-1 rounded-lg backdrop-blur-md shadow-2xl">
              {user ? (
                <div className="flex items-center gap-2 pr-2">
                  <div className="w-8 h-8 rounded-md bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/20">
                    <User size={16} />
                  </div>
                  <div className="hidden md:block">
                    <p className="text-[9px] font-black text-white leading-none truncate max-w-[80px]">
                      {user.email.split('@')[0]}
                    </p>
                    <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest">Connecté</p>
                  </div>
                  <button
                    onClick={signOut}
                    className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition-colors"
                    title="Déconnexion"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white transition-colors"
                >
                  Se connecter
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />

      <RouteLibrary 
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
      />
    </div>
  );
}

export default App;
