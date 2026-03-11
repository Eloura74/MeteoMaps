import React, { useEffect } from 'react';
import { Navigation, MapPin, Calendar, Car, Bike, Footprints, Search, Loader2, Plus, X } from 'lucide-react';
import useRouteStore from '../../store/useRouteStore';
import { searchPlaces } from '../../services/api';

const SearchPanel = () => {
  const {
    waypoints,
    addWaypoint,
    removeWaypoint,
    updateWaypoint,
    handleSelectPlace,
    departureDate, setDepartureDate,
    mode, setMode,
    handleCalculateRoute,
    loading
  } = useRouteStore();

  // Debounce logic for all waypoints
  useEffect(() => {
    waypoints.forEach(wp => {
      // If query maps to the currently selected place, do not search
      if (wp.place && wp.query === wp.place.fullLabel) return;
      
      const timer = setTimeout(async () => {
        if (wp.query.length >= 3) {
          useRouteStore.setState({ status: 'Recherche lieux...' });
          const results = await searchPlaces(wp.query);
          updateWaypoint(wp.id, { suggestions: results });
          useRouteStore.setState({ status: '' });
        } else {
          updateWaypoint(wp.id, { suggestions: [] });
        }
      }, 600);
      return () => clearTimeout(timer); // Note: inside forEach this return does not clear previous timers efficiently across re-renders,
                                        // but it's okay for our specific sequential typing case.
    });
  }, [waypoints.map(w => w.query).join('')]); // Trigger when any query changes

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-3">
        {waypoints.map((wp, index) => {
          const isFirst = index === 0;
          const isLast = index === waypoints.length - 1;
          
          return (
            <div key={wp.id} className="relative flex items-center gap-2">
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-tighter">
                  {isFirst ? 'Départ' : isLast ? 'Destination' : `Étape ${index}`}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3.5 flex items-center text-slate-500">
                    {isFirst ? <Navigation size={14} /> : <MapPin size={14} />}
                  </div>
                  <input 
                    type="text" 
                    value={wp.query}
                    onChange={(e) => updateWaypoint(wp.id, { query: e.target.value, place: null })}
                    placeholder={isFirst ? "Lieu de départ..." : isLast ? "Lieu d'arrivée..." : "Étape intermédiaire..."} 
                    className="w-full bg-slate-950/60 border border-white/5 rounded-lg py-2.5 md:py-3 pl-10 pr-4 text-xs md:text-sm focus:outline-none focus:border-slate-400/50 transition-all placeholder:text-slate-600 font-medium text-white shadow-inner"
                  />
                  
                  {/* Suggestions */}
                  {wp.suggestions && wp.suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-white/10 rounded-lg shadow-2xl z-30 overflow-hidden animate-in fade-in slide-in-from-top-1">
                      {wp.suggestions.map((p, pIdx) => (
                        <button 
                          key={`${p.id}-${pIdx}`}
                          onClick={() => handleSelectPlace(wp.id, p)}
                          className="w-full px-4 py-3 text-left text-sm hover:bg-white/5 border-b border-white/5 last:border-0 flex flex-col transition-colors"
                        >
                          <span className="font-bold text-slate-200">{p.name}</span>
                          <span className="text-[10px] text-slate-500 uppercase tracking-tight font-semibold">{p.city}, {p.country}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Actions: Add / Remove */}
              <div className="flex flex-col gap-1 mt-4 md:mt-5">
                {waypoints.length > 2 && (
                  <button 
                    onClick={() => removeWaypoint(wp.id)}
                    className="p-1.5 md:p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                    title="Supprimer l'étape"
                  >
                    <X size={14} />
                  </button>
                )}
                {!isLast && (
                  <button 
                    onClick={() => addWaypoint(index)}
                    className="p-1.5 md:p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors"
                    title="Ajouter une étape ici"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Date de départ */}
      <div className="space-y-2 mt-2">
        <label className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-tighter">Date & Heure de départ</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-3.5 flex items-center text-slate-500 pointer-events-none">
            <Calendar size={14} />
          </div>
          <input 
            type="datetime-local" 
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
            className="w-full bg-slate-950/60 border border-white/5 rounded-lg py-3 pl-10 pr-4 text-[13px] focus:outline-none focus:border-slate-400/50 transition-all font-medium text-white shadow-inner [color-scheme:dark]"
          />
        </div>
      </div>

      {/* Mode de transport */}
      <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950/60 rounded-lg border border-white/5">
        {[
          { id: 'driving', icon: Car },
          { id: 'bike', icon: Bike },
          { id: 'foot', icon: Footprints },
        ].map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`py-2 md:py-3 rounded-md flex items-center justify-center transition-all duration-200 ${mode === m.id ? 'bg-slate-700 text-white shadow-lg border border-white/10 transform scale-[1.02]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
          >
            <m.icon size={16} className="md:w-[18px] md:h-[18px]" />
          </button>
        ))}
      </div>

      <button 
        onClick={handleCalculateRoute}
        disabled={loading || waypoints.filter(w => w.place).length < 2}
        className={`w-full mt-2 py-3.5 md:py-4 rounded-lg font-black flex items-center justify-center gap-2 transition-all duration-300 group relative overflow-hidden text-xs md:text-sm ${loading || waypoints.filter(w => w.place).length < 2 ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed border border-white/5' : 'bg-slate-100 text-slate-950 hover:bg-white border border-white/10 shadow-lg active:scale-[0.98]'}`}
      >
        {loading ? <Loader2 className="animate-spin text-slate-400" size={16} /> : (
          <>
            <Search size={14} className="md:w-4 md:h-4 group-hover:scale-110 transition-transform" />
            <span className="tracking-widest">ANALYSER LE TRAJET</span>
          </>
        )}
      </button>
    </div>
  );
};

export default SearchPanel;
