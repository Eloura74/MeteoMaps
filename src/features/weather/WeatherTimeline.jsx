import React from 'react';
import { Thermometer, Sun, Moon, Cloud, CloudSun, CloudMoon, CloudLightning, Wind, CloudRain, ArrowUp, ArrowDown, MoveHorizontal } from 'lucide-react';

export const getWeatherIcon = (code, isDay) => {
  const icons = {
    0: isDay ? Sun : Moon, // Clear
    1: isDay ? CloudSun : CloudMoon, // Mainly clear
    2: isDay ? CloudSun : CloudMoon, // Partly cloudy
    3: Cloud, // Overcast
    45: Cloud, // Fog
    48: Cloud, // Depositing rime fog
    51: CloudRain, // Drizzle: Light
    53: CloudRain, // Drizzle: Moderate
    55: CloudRain, // Drizzle: Dense intensity
    61: CloudRain, // Rain: Slight
    63: CloudRain, // Rain: Moderate
    65: CloudRain, // Rain: Heavy intensity
    71: CloudRain, // Snow fall: Slight
    80: CloudRain, // Rain showers: Slight
    95: CloudLightning, // Thunderstorm: Slight or moderate
  };
  return icons[code] || (isDay ? Sun : Moon);
};

export const getWeatherLabel = (code) => {
  if (code === 0) return 'Soleil';
  if (code <= 3) return 'Nuageux';
  if (code >= 51 && code <= 67) return 'Pluie';
  if (code >= 71 && code <= 86) return 'Neige';
  if (code >= 95) return 'Orage';
  if (code >= 45 && code <= 48) return 'Brouillard';
  return 'Variable';
};

const WeatherTimeline = ({ weatherPoints }) => {
  if (!weatherPoints || weatherPoints.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
          <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Projection Climatique</h3>
          {weatherPoints[0]?.weather && weatherPoints[weatherPoints.length-1]?.weather && (
            <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
              <Thermometer size={10} strokeWidth={2} />
              {Math.round(weatherPoints[0].weather.temperature_2m)}° → {Math.round(weatherPoints[weatherPoints.length-1].weather.temperature_2m)}°
            </div>
          )}
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x pt-1">
          {weatherPoints.map((p, i) => {
            const WeatherIcon = p.weather ? getWeatherIcon(p.weather.weather_code, p.weather.is_day) : Sun;
            return (
              <div key={i} className="flex-shrink-0 w-24 bg-slate-950/80 border border-white/5 rounded-lg p-4 flex flex-col items-center gap-4 snap-center shadow-lg hover:border-slate-500 transition-colors group">
                  <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest">
                    {p.isStart ? 'Départ' : p.isEnd ? 'Arrivée' : `Étape ${i}`}
                  </div>
                  <div className="text-slate-400 group-hover:scale-110 transition-transform duration-300 flex flex-col items-center gap-1">
                    <WeatherIcon size={22} strokeWidth={2} />
                    <span className="text-[7px] font-black uppercase tracking-tighter text-slate-500 whitespace-nowrap">
                      {p.weather ? getWeatherLabel(p.weather.weather_code) : ''}
                    </span>
                  </div>
                  <div className="text-sm font-black text-white">{p.weather ? `${Math.round(p.weather.temperature_2m)}°` : '--'}</div>
                   <div className="flex flex-col items-center gap-1.5 w-full">
                    <div className="flex items-center justify-between w-full px-1 text-[8px] font-black uppercase text-slate-500 bg-white/5 py-1 rounded">
                      <div className="flex items-center gap-1">
                        <Wind size={8} /> <span>{p.weather ? Math.round(p.weather.wind_speed_10m) : 0}</span>
                      </div>
                      {p.aero && (
                        <div className="flex gap-1">
                          {p.aero.headwind > 2 && (
                            <span className="text-red-400 flex items-center bg-red-400/10 px-0.5 rounded" title="Vent de face">
                              <ArrowUp size={8} />
                            </span>
                          )}
                          {p.aero.tailwind > 5 && (
                            <span className="text-emerald-400 flex items-center bg-emerald-400/10 px-0.5 rounded" title="Vent de dos">
                              <ArrowDown size={8} />
                            </span>
                          )}
                          {p.aero.crosswind > 10 && (
                            <span className="text-blue-400 flex items-center bg-blue-400/10 px-0.5 rounded" title="Vent de travers">
                              <MoveHorizontal size={8} />
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[8px] font-black uppercase text-slate-500 bg-white/5 w-full justify-center py-1 rounded">
                       <CloudRain size={8} /> {p.weather ? p.weather.precipitation : 0} <span className="text-[6px] opacity-60">mm</span>
                    </div>
                  </div>

                  {/* Solar Analysis Badge */}
                  {p.exposition && (
                    <div className={`mt-1 flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[7px] font-black uppercase tracking-widest ${
                      p.exposition === 'Ensoleillé' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                      p.exposition === 'Ombre' ? 'bg-slate-800 border-white/5 text-slate-400' :
                      'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                    }`}>
                      {p.exposition === 'Ensoleillé' ? <Sun size={8} /> : 
                       p.exposition === 'Nuit' ? <Moon size={8} /> : <Cloud size={8} />}
                      {p.exposition}
                    </div>
                  )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default WeatherTimeline;
