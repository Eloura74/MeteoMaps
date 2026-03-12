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

  useEffect(() => {
    waypoints.forEach(wp => {
      if (wp.place && wp.query === wp.place.fullLabel) return;
      const timer = setTimeout(async () => {
        if (wp.query.length >= 3) {
          useRouteStore.setState({ status: 'Localisation...' });
          const results = await searchPlaces(wp.query);
          updateWaypoint(wp.id, { suggestions: results });
          useRouteStore.setState({ status: '' });
        } else {
          updateWaypoint(wp.id, { suggestions: [] });
        }
      }, 600);
      return () => clearTimeout(timer);
    });
  }, [waypoints.map(w => w.query).join('')]);

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-4">
        {waypoints.map((wp, index) => {
          const isFirst = index === 0;
          const isLast = index === waypoints.length - 1;
          
          return (
            <div key={wp.id} className="relative flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <label className="text-[9px] font-black text-zinc-500 ml-1 uppercase tracking-[0.2em]">
                  {isFirst ? 'Départ' : isLast ? 'Destination' : `Étape ${index}`}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center text-zinc-500 group-focus-within:text-blue-400 transition-colors">
                    {isFirst ? <Navigation size={14} /> : <MapPin size={14} />}
                  </div>
                  <input 
                    type="text" 
                    value={wp.query}
                    onChange={(e) => updateWaypoint(wp.id, { query: e.target.value, place: null })}
                    placeholder={isFirst ? "Lieu de départ..." : isLast ? "Lieu d'arrivée..." : "Étape intermédiaire..."} 
                    className="w-full bg-zinc-950/40 border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-[13px] focus:outline-none focus:border-blue-500/30 transition-all placeholder:text-zinc-600 font-medium text-white shadow-inner"
                  />
                  
                  {/* Suggestions Overlay */}
                  {wp.suggestions && wp.suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-3 bg-zinc-900 border border-white/10 rounded-[1.5rem] shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 backdrop-blur-3xl">
                      {wp.suggestions.map((p, pIdx) => (
                        <button 
                          key={`${p.id}-${pIdx}`}
                          onClick={() => handleSelectPlace(wp.id, p)}
                          className="w-full px-5 py-4 text-left hover:bg-white/5 border-b border-white/5 last:border-0 flex flex-col transition-all"
                        >
                          <span className="font-bold text-zinc-100 text-[13px]">{p.name}</span>
                          <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold mt-1">{p.city}, {p.country}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col gap-1 mb-1">
                {waypoints.length > 2 && (
                  <button 
                    onClick={() => removeWaypoint(wp.id)}
                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                  >
                    <X size={14} />
                  </button>
                )}
                {!isLast && (
                  <button 
                    onClick={() => addWaypoint(index)}
                    className="p-2 text-zinc-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-xl transition-all"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-1.5 mt-2">
        <label className="text-[9px] font-black text-zinc-500 ml-1 uppercase tracking-[0.2em]">Moment du départ</label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center text-zinc-500 group-focus-within:text-blue-400 transition-colors pointer-events-none">
            <Calendar size={14} />
          </div>
          <input 
            type="datetime-local" 
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
            className="w-full bg-zinc-950/40 border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-[13px] focus:outline-none focus:border-blue-500/30 transition-all font-medium text-white shadow-inner [color-scheme:dark]"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 p-1 bg-zinc-950/40 rounded-2xl border border-white/5 mt-2">
        {[
          { id: 'driving', icon: Car },
          { id: 'bike', icon: Bike },
          { id: 'foot', icon: Footprints },
        ].map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`py-3 rounded-xl flex items-center justify-center transition-all duration-300 ${mode === m.id ? 'bg-zinc-800 text-white shadow-xl border border-white/10 scale-[1.05]' : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'}`}
          >
            <m.icon size={18} />
          </button>
        ))}
      </div>

      <button 
        onClick={handleCalculateRoute}
        disabled={loading || waypoints.filter(w => w.place).length < 2}
        className={`w-full mt-4 py-4.5 rounded-[1.5rem] font-black flex items-center justify-center gap-3 transition-all duration-500 group relative overflow-hidden text-[13px] ${loading || waypoints.filter(w => w.place).length < 2 ? 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed border border-white/5' : 'bg-white text-zinc-950 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-95'}`}
      >
        {loading ? <Loader2 className="animate-spin text-zinc-500" size={18} /> : (
          <>
            <Search size={16} className="group-hover:scale-110 transition-transform" />
            <span className="tracking-[0.2em] font-black">ANALYSER LE TRAJET</span>
          </>
        )}
      </button>
    </div>
  );
};

export default SearchPanel;
