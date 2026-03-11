import React, { useState } from 'react';
import { Cloud, Check, Loader2 } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useRouteStore from '../store/useRouteStore';

const SaveRouteButton = ({ onRequireAuth }) => {
  const { user } = useAuthStore();
  const { saveRouteToCloud, loading, routes, activeRouteIndex } = useRouteStore();
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const activeRoute = routes[activeRouteIndex];

  // Si pas d'itinéraire calculé, on ne montre rien ou on le désactive.
  // Mais puisqu'il est dans la sidebar quand la route est active, on le suppose valide.

  const handleSave = async () => {
    if (!user) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    
    if (!activeRoute) return;

    setIsSaving(true);
    const result = await saveRouteToCloud(user.id, `Itinéraire vers ${activeRoute?.summary || 'Destination inconnue'}`);
    setIsSaving(false);
    
    if (result) {
      setSaved(true);
      setTimeout(() => setSaved(false), 5000);
    }
  };

  return (
    <button 
      onClick={handleSave} 
      disabled={isSaving || saved || loading}
      className={`w-full mb-3 py-3.5 rounded-lg border flex items-center justify-center gap-2 transition-all duration-300 shadow-lg font-black uppercase tracking-widest text-[10px] 
        ${saved ? 'bg-emerald-500 text-white border-emerald-400' : 
          !user ? 'bg-slate-800/50 text-slate-400 border-white/5 hover:bg-slate-700/50' :
          'bg-blue-600 hover:bg-blue-500 text-white border-blue-400/50 hover:shadow-blue-900/50'}`}
    >
      {isSaving ? (
        <Loader2 size={14} className="animate-spin" />
      ) : saved ? (
        <Check size={14} />
      ) : (
        <Cloud size={14} />
      )}
      <span>
        {saved ? 'Itinéraire sauvegardé !' : 
         !user ? 'Connectez-vous pour sauvegarder' : 
         'Sauvegarder dans le Cloud'}
      </span>
    </button>
  );
};

export default SaveRouteButton;
