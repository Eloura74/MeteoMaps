import React, { useEffect } from 'react';
import useRouteStore from '../store/useRouteStore';
import { X, Globe, Calendar, ChevronRight } from 'lucide-react';
import { getGradeColor } from '../utils/WeatherScorer';

const DiscoveryHub = ({ isOpen, onClose, hideModalShell = false }) => {
  const { publicRoutes, fetchPublicRoutes, loadRouteFromCloud, loading } = useRouteStore();

  useEffect(() => {
    if (isOpen) {
      fetchPublicRoutes();
    }
  }, [isOpen, fetchPublicRoutes]);

  if (!isOpen) return null;

  const content = (
    <div className="space-y-6">
      {loading && publicRoutes.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4 text-zinc-500">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Recherche d'aventures...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {publicRoutes.map((route) => {
            const score = route.weather_score;
            return (
              <div 
                key={route.id}
                className="group bg-zinc-900/40 border border-white/5 hover:border-white/10 rounded-2xl p-5 transition-all duration-300 hover:bg-zinc-800/60 glass-card"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                      {route.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold">
                      <Calendar size={10} />
                      {new Date(route.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  {score && (
                    <div className={`px-2 py-1 rounded-lg text-xs font-black border ${getGradeColor(score.grade)}`}>
                      {score.grade}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 mb-5">
                  <div className="bg-zinc-950/60 p-2 rounded-xl border border-white/5 space-y-0.5">
                    <div className="text-[7px] text-zinc-500 font-black uppercase tracking-widest">Distance</div>
                    <div className="text-[11px] font-black text-zinc-300">{(score?.distance / 1000).toFixed(1)} km</div>
                  </div>
                  <div className="bg-zinc-950/60 p-2 rounded-xl border border-white/5 space-y-0.5">
                    <div className="text-[7px] text-zinc-500 font-black uppercase tracking-widest">Relief D+</div>
                    <div className="text-[11px] font-black text-zinc-300">{Math.round(score?.ascent || 0)} m</div>
                  </div>
                  <div className="bg-zinc-950/60 p-2 rounded-xl border border-white/5 space-y-0.5">
                    <div className="text-[7px] text-zinc-500 font-black uppercase tracking-widest text-center">Steps</div>
                    <div className="text-[11px] font-black text-zinc-300 text-center">{route.waypoints?.length || 0}</div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    loadRouteFromCloud(route.id);
                    onClose();
                  }}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white rounded-xl border border-white/5 flex items-center justify-center gap-2 transition-all group/btn"
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Charger l'expédition</span>
                  <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {publicRoutes.length === 0 && !loading && (
        <div className="h-48 flex flex-col items-center justify-center gap-4 text-zinc-500">
          <Globe size={40} className="opacity-20" />
          <span className="text-xs font-bold uppercase tracking-widest">Aucune expédition partagée</span>
        </div>
      )}
    </div>
  );

  if (hideModalShell) return content;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden glass-card">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
              <Globe size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">COMMUNAUTÉ</h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Explorez les traces partagées</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 text-zinc-500 hover:text-white rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {content}
        </div>

        <div className="p-6 border-t border-white/5 bg-zinc-900/50 flex items-center justify-between">
          <div className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">
            MeteoMap Community
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            {publicRoutes.length} Explorateurs actifs
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscoveryHub;
