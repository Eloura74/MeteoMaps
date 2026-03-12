import React, { useEffect } from 'react';
import { X, Trash2, Calendar, ArrowRight, Loader2, Info, MapIcon } from 'lucide-react';
import useRouteStore from '../store/useRouteStore';
import useAuthStore from '../store/useAuthStore';

const RouteLibrary = ({ isOpen, onClose, hideModalShell = false }) => {
  const { user } = useAuthStore();
  const { 
    userRoutes, 
    fetchUserRoutes, 
    loadRouteFromCloud, 
    deleteRouteFromCloud, 
    loading 
  } = useRouteStore();

  useEffect(() => {
    if (isOpen && user) {
      fetchUserRoutes(user.id);
    }
  }, [isOpen, user, fetchUserRoutes]);

  if (!isOpen) return null;

  const content = (
    <div className="space-y-4">
      {loading && userRoutes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-zinc-500">
          <Loader2 className="animate-spin text-blue-500" size={32} />
          <span className="font-bold uppercase tracking-widest text-xs">Synchronisation...</span>
        </div>
      ) : userRoutes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-zinc-500 text-center">
          <div className="bg-zinc-800 p-4 rounded-full mb-2">
            <Info size={32} />
          </div>
          <p className="font-bold text-zinc-300 text-sm">Aucun itinéraire</p>
          <p className="text-[10px] max-w-xs uppercase tracking-tight text-zinc-500 font-bold">Sauvegardez un trajet pour le retrouver ici.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {userRoutes.map((route) => (
            <div 
              key={route.id}
              className="group relative bg-zinc-900/40 hover:bg-zinc-800/80 border border-white/5 rounded-2xl p-4 transition-all duration-300 flex items-center justify-between gap-4 glass-card"
            >
              <div 
                className="flex-1 cursor-pointer overflow-hidden"
                onClick={() => {
                  loadRouteFromCloud(route.id);
                  onClose();
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-zinc-100 group-hover:text-blue-400 transition-colors truncate text-sm">
                    {route.title || 'Itinéraire sans nom'}
                  </h3>
                </div>
                
                <div className="flex items-center gap-4 text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
                  <div className="flex items-center gap-1">
                    <Calendar size={11} />
                    {new Date(route.created_at).toLocaleDateString()}
                  </div>
                  {route.weather_score && (
                    <div className="flex items-center gap-1">
                      <span className="text-blue-400">Score {route.weather_score.grade}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (window.confirm('Supprimer cet itinéraire ?')) {
                      deleteRouteFromCloud(route.id, user.id);
                    }
                  }}
                  className="p-2.5 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 rounded-xl transition-all"
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={() => {
                    loadRouteFromCloud(route.id);
                    onClose();
                  }}
                  className="p-2.5 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded-xl transition-all"
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (hideModalShell) return content;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden glass-card">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
              <MapIcon size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">BIBLIOTHÈQUE</h2>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Vos expéditions Cloud</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-zinc-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {content}
        </div>

        <div className="p-4 bg-zinc-950/40 border-t border-white/5 text-center">
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
            {userRoutes.length} expédition{userRoutes.length > 1 ? 's' : ''} archivée{userRoutes.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RouteLibrary;
