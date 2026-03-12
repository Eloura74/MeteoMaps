import React from 'react';
import useRouteStore from '../store/useRouteStore';
import { Clock, ChevronRight, TrendingUp, Sun, Wind, Scan, Ghost } from 'lucide-react';
import { getGradeColor } from '../utils/WeatherScorer';

const DepartureHeatmap = () => {
  const { 
    timeOptimization, 
    departureDate, 
    setDepartureDate, 
    calculateRouteDetails, 
    activeRouteIndex,
    ghostModeActive,
    toggleGhostMode 
  } = useRouteStore();

  if (!timeOptimization || timeOptimization.length === 0) return null;

  const bestSlot = [...timeOptimization].sort((a, b) => b.score - a.score)[0];
  const currentDeparture = new Date(departureDate).getTime();

  const handleSlotSelect = (time) => {
    const formatted = new Date(time).toISOString().slice(0, 16);
    setDepartureDate(formatted);
    calculateRouteDetails(activeRouteIndex);
  };

  return (
    <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-emerald-400" />
          <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Optimiseur de Départ</h4>
        </div>
        <button 
          onClick={() => toggleGhostMode(!ghostModeActive)}
          className={`p-1.5 rounded-md border transition-all duration-300 flex items-center gap-1.5 ${ghostModeActive ? 'bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
        >
          <Scan size={12} className={ghostModeActive ? 'animate-pulse' : ''} />
          <span className="text-[8px] font-bold uppercase tracking-widest">Ghost Preview</span>
        </button>
      </div>

      <div className="flex gap-1.5 h-16 items-end">
        {timeOptimization.map((slot, idx) => {
          const isSelected = Math.abs(new Date(slot.time).getTime() - currentDeparture) < 1800000;
          const isBest = slot.time === bestSlot.time;
          
          return (
            <button
              key={idx}
              onClick={() => handleSlotSelect(slot.time)}
              className={`flex-1 group relative flex flex-col items-center gap-1 transition-all duration-300`}
              title={`${new Date(slot.time).getHours()}h : Score ${slot.score}`}
            >
              <div 
                className={`w-full rounded-t-sm transition-all duration-500 ${isSelected ? 'ring-1 ring-white/50' : ''} ${getGradeColor(slot.grade).replace('text-', 'bg-').split(' ')[0]}`}
                style={{ height: `${Math.max(15, slot.score)}%`, opacity: isSelected ? 1 : 0.4 }}
              />
              <span className={`text-[7px] font-black ${isSelected ? 'text-white' : 'text-slate-600'}`}>
                {new Date(slot.time).getHours()}h
              </span>
              {isBest && (
                <div className="absolute -top-4 animate-bounce">
                  <Star size={8} className="text-yellow-400 fill-yellow-400" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {bestSlot && bestSlot.score > timeOptimization[0]?.score + 5 && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 flex items-center justify-between group cursor-pointer hover:bg-emerald-500/20 transition-colors"
             onClick={() => handleSlotSelect(bestSlot.time)}>
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-md">
              <Clock size={12} />
            </div>
            <div>
              <p className="text-[9px] font-black text-emerald-400 uppercase tracking-tight">Meilleur Créneau détecté</p>
              <p className="text-[11px] font-bold text-white">Départ à {new Date(bestSlot.time).getHours()}h00</p>
            </div>
          </div>
          <ChevronRight size={14} className="text-emerald-500 group-hover:translate-x-1 transition-transform" />
        </div>
      )}
    </div>
  );
};

const Star = ({ size, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
);

export default DepartureHeatmap;
