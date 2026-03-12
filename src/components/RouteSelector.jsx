import React from 'react';
import { getGradeColor } from '../utils/WeatherScorer';
import { Clock, Navigation2, CheckCircle2 } from 'lucide-react';

const RouteSelector = ({ routes, activeIndex, scores, onSelect }) => {
  if (!routes || routes.length <= 1) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Alternatives IA</h3>
        <span className="text-[8px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest">
          {routes.length} Options
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {routes.map((route, i) => {
          const isActive = i === activeIndex;
          const score = scores[i];
          const gradeColor = score ? getGradeColor(score.grade) : 'text-slate-500';
          
          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              className={`group relative overflow-hidden text-left p-3 rounded-xl border transition-all duration-300 ${
                isActive 
                  ? 'bg-slate-900 border-white/20 shadow-xl shadow-black/40 ring-1 ring-white/10' 
                  : 'bg-slate-950/40 border-white/5 hover:border-white/10 hover:bg-slate-900/60'
              }`}
            >
              {/* Background gradient for active */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent pointer-events-none" />
              )}

              <div className="flex items-start justify-between relative z-10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-blue-400' : 'text-slate-500'}`}>
                      {score?.label || `Option ${i + 1}`}
                    </span>
                    {isActive && <CheckCircle2 size={10} className="text-blue-400" />}
                  </div>
                  
                  <div className="flex items-center gap-3 text-slate-400">
                    <div className="flex items-center gap-1">
                      <Clock size={10} className="opacity-50" />
                      <span className="text-[10px] font-bold">
                        {Math.round(route.duration / 60)} min
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Navigation2 size={10} className="opacity-50" />
                      <span className="text-[10px] font-bold">
                        {(route.distance / 1000).toFixed(1)} km
                      </span>
                    </div>
                  </div>
                </div>

                {score && (
                  <div className={`flex flex-col items-center justify-center w-10 h-10 rounded-lg border backdrop-blur-md ${gradeColor.split(' ')[2]} ${gradeColor.split(' ')[1]}`}>
                    <span className={`text-lg font-black leading-none ${gradeColor.split(' ')[0]}`}>
                      {score.grade}
                    </span>
                    <span className="text-[6px] font-black uppercase opacity-60">Score</span>
                  </div>
                )}
              </div>

              {/* Summary text */}
              {route.summary && (
                <div className="mt-2 pt-2 border-t border-white/5">
                  <p className="text-[8px] text-slate-500 font-bold uppercase truncate">
                    Via {route.summary}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RouteSelector;
