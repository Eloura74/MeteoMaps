import React, { useEffect } from 'react';
import { X, Trash2, MapIcon, Calendar, ArrowRight, Loader2, Info } from 'lucide-react';
import useRouteStore from '../store/useRouteStore';
import useAuthStore from '../store/useAuthStore';

const RouteLibrary = ({ isOpen, onClose }) => {
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

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
              <MapIcon size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Mes Expéditions</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Bibliothèque Cloud</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {loading && userRoutes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-500">
              <Loader2 className="animate-spin text-blue-500" size={32} />
              <span className="font-bold uppercase tracking-widest text-xs">Synchronisation...</span>
            </div>
          ) : userRoutes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-500 text-center">
              <div className="bg-slate-800 p-4 rounded-full mb-2">
                <Info size={32} />
              </div>
              <p className="font-bold text-slate-300">Aucun itinéraire sauvegardé</p>
              <p className="text-xs max-w-xs uppercase tracking-tighter">Analysez un trajet et sauvegardez-le dans le cloud pour le retrouver ici.</p>
            </div>
          ) : (
            userRoutes.map((route) => (
              <div 
                key={route.id}
                className="group relative bg-slate-800/40 hover:bg-slate-800/80 border border-white/5 rounded-xl p-4 transition-all duration-300 flex items-center justify-between gap-4"
              >
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => {
                    loadRouteFromCloud(route.id);
                    onClose();
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors truncate max-w-[300px]">
                      {route.title || 'Itinéraire sans nom'}
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(route.created_at).toLocaleDateString()}
                    </div>
                    {route.weather_score && (
                      <div className="flex items-center gap-1">
                        <span className="text-blue-400">Score: {route.weather_score.grade}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                        loadRouteFromCloud(route.id);
                        onClose();
                    }}
                    className="p-2 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded-lg transition-all"
                    title="Ouvrir"
                  >
                    <ArrowRight size={18} />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Supprimer cet itinéraire définitivement ?')) {
                        deleteRouteFromCloud(route.id, user.id);
                      }
                    }}
                    className="p-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-all"
                    title="Supprimer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/40 border-t border-white/5 text-center">
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
            {userRoutes.length} expédition{userRoutes.length > 1 ? 's' : ''} archivée{userRoutes.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RouteLibrary;
