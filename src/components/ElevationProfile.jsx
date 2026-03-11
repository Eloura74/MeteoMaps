import React from 'react';
import { TrendingUp } from 'lucide-react';

const ElevationProfile = ({ points, totalAscent }) => {
  if (!points || points.length < 2) return null;

  const elevations = points.map(p => p.elevation);
  const min = Math.min(...elevations);
  const max = Math.max(...elevations);
  const range = max - min || 1;

  // Chart dimensions
  const width = 300;
  const height = 60;
  const padding = 5;

  const getX = (i) => (i / (points.length - 1)) * width;
  const getY = (val) => height - padding - ((val - min) / range) * (height - 2 * padding);

  const pathData = points.map((p, i) => `${getX(i)},${getY(p.elevation)}`).join(' L ');
  const areaData = `M ${pathData} L ${width},${height} L 0,${height} Z`;

  return (
    <div className="space-y-3 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="flex items-center justify-between">
        <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
          Verticalité <TrendingUp size={10} />
        </h3>
        <div className="text-[10px] font-black text-slate-300 bg-white/5 px-2 py-0.5 rounded border border-white/5 shadow-inner">
          D+ {totalAscent}m
        </div>
      </div>

      <div className="relative group">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-16 drop-shadow-[0_0_15px_rgba(255,255,255,0.02)]"
          preserveAspectRatio="none"
        >
          {/* Gradient Definition */}
          <defs>
            <linearGradient id="elevationGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(71 85 105)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(71 85 105)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area */}
          <path 
            d={areaData} 
            fill="url(#elevationGradient)"
            className="transition-all duration-1000"
          />

          {/* Line */}
          <path 
            d={`M ${pathData}`} 
            fill="none" 
            stroke="rgb(148 163 184)" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="transition-all duration-1000 opacity-50 group-hover:opacity-100"
          />
          
          {/* Subtle Grid Lines (Min/Max) */}
          <line x1="0" y1={getY(min)} x2={width} y2={getY(min)} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" strokeDasharray="2,2" />
          <line x1="0" y1={getY(max)} x2={width} y2={getY(max)} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" strokeDasharray="2,2" />
        </svg>
        
        {/* Min/Max Labels */}
        <div className="absolute top-0 left-0 text-[7px] text-slate-600 font-bold">{Math.round(max)}m</div>
        <div className="absolute bottom-0 left-0 text-[7px] text-slate-600 font-bold">{Math.round(min)}m</div>
      </div>
    </div>
  );
};

export default ElevationProfile;
