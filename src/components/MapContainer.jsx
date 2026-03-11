import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, Globe, Map as MapIcon, Activity, CloudRain } from 'lucide-react';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const VIEWS = {
  standard: {
    name: 'Standard',
    icon: MapIcon,
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CartoDB'
  },
  satellite: {
    name: 'Satellite',
    icon: Globe,
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
  },
  terrain: {
    name: 'Topographie',
    icon: Activity,
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)'
  }
};

const MapContainer = ({ routes = [], activeRouteIndex = 0, onRouteSelect, weatherPoints }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const markersRef = useRef([]);
  const radarLayerRef = useRef(null);
  const [activeView, setActiveView] = useState('standard');
  const [radarEnabled, setRadarEnabled] = useState(false);

  useEffect(() => {
    if (!mapInstanceRef.current && mapRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([46.2276, 2.2137], 6);

      layerRef.current = L.tileLayer(VIEWS.standard.url, {
        maxZoom: 20,
        attribution: VIEWS.standard.attribution
      }).addTo(mapInstanceRef.current);

      L.control.zoom({ position: 'bottomright' }).addTo(mapInstanceRef.current);
    }
  }, []);

  // Update TileLayer when view changes
  useEffect(() => {
    if (mapInstanceRef.current && layerRef.current) {
      layerRef.current.setUrl(VIEWS[activeView].url);
    }
  }, [activeView]);

  useEffect(() => {
    if (mapInstanceRef.current && routes && routes.length > 0) {
      // Clear previous route(s)
      if (routeLayerRef.current) {
        mapInstanceRef.current.removeLayer(routeLayerRef.current);
      }

      const layers = routes.map((route, idx) => {
        const isActive = idx === activeRouteIndex;
        const polyline = L.geoJSON(route.geometry, {
          style: {
            color: isActive ? (activeView === 'satellite' ? '#ffffff' : '#94a3b8') : '#334155',
            weight: isActive ? 4 : 3,
            opacity: isActive ? 0.9 : 0.6,
            lineCap: 'round',
            lineJoin: 'round',
            dashArray: isActive ? null : '5, 10',
          }
        });

        if (!isActive && onRouteSelect) {
          polyline.on('click', () => {
            onRouteSelect(idx);
          });
          polyline.on('mouseover', (e) => {
            e.layer.setStyle({ opacity: 0.9, color: '#475569', weight: 4 });
          });
          polyline.on('mouseout', (e) => {
            e.layer.setStyle({ opacity: 0.6, color: '#334155', weight: 3 });
          });
        }
        
        return polyline;
      });

      // Add all routes to map
      routeLayerRef.current = L.featureGroup(layers).addTo(mapInstanceRef.current);

      // Fit bounds to all available routes for context
      mapInstanceRef.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [50, 50] });
      
      // Bring active route to front
      layers[activeRouteIndex].bringToFront();
    }
  }, [routes, activeRouteIndex, activeView, onRouteSelect]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    if (radarEnabled) {
      fetch('https://api.rainviewer.com/public/weather-maps.json')
        .then(res => res.json())
        .then(data => {
          if (!data || !data.radar || !data.radar.past) return;
          const past = data.radar.past;
          const latestTs = past[past.length - 1].path; // get latest past frame
          const url = `https://tilecache.rainviewer.com${latestTs}/256/{z}/{x}/{y}/2/1_1.png`;
          
          radarLayerRef.current = L.tileLayer(url, {
            opacity: 0.5,
            zIndex: 10,
            attribution: 'Radar &copy; RainViewer'
          }).addTo(mapInstanceRef.current);
        })
        .catch(err => console.error("Error fetching RainViewer API:", err));
    } else {
      if (radarLayerRef.current) {
        mapInstanceRef.current.removeLayer(radarLayerRef.current);
        radarLayerRef.current = null;
      }
    }
  }, [radarEnabled]);

  useEffect(() => {
    if (mapInstanceRef.current && weatherPoints.length > 0) {
      // Clear previous markers
      markersRef.current.forEach(m => mapInstanceRef.current.removeLayer(m));
      markersRef.current = [];

      // Add new markers
      weatherPoints.forEach((p, index) => {
        const iconHtml = createWeatherIconHtml(p);
        const icon = L.divIcon({
          html: iconHtml,
          className: 'custom-weather-icon',
          iconSize: [60, 50],
          iconAnchor: [30, 50],
          popupAnchor: [0, -50],
        });

        const marker = L.marker([p.lat, p.lng], { icon })
          .bindPopup(createWeatherPopupHtml(p), { className: 'weather-popup', maxWidth: 300 })
          .addTo(mapInstanceRef.current);
        
        markersRef.current.push(marker);
        
        if (p.isStart || p.isEnd) {
          setTimeout(() => marker.openPopup(), 500);
        }
      });
    }
  }, [weatherPoints]);

  return (
    <div className="h-full w-full relative z-10">
      <div ref={mapRef} className="h-full w-full" />
      
      {/* HUD Layer Control */}
      <div className="absolute top-3 right-3 md:top-6 md:right-6 z-[1000] flex flex-col gap-2">
        <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-lg p-1.5 shadow-2xl flex flex-col gap-1">
          {Object.entries(VIEWS).map(([key, view]) => {
            const Icon = view.icon;
            return (
              <button
                key={key}
                onClick={() => setActiveView(key)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group ${activeView === key ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}
                title={view.name}
              >
                <Icon size={16} className={activeView === key ? 'scale-110' : 'group-hover:scale-110 transition-transform'} />
                <span className="text-[10px] font-black uppercase tracking-widest pr-2 hidden md:block">
                  {view.name}
                </span>
              </button>
            );
          })}
          
          <div className="h-px w-full bg-white/10 my-1"></div>
          
          <button
            onClick={() => setRadarEnabled(!radarEnabled)}
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group ${radarEnabled ? 'bg-blue-900/40 text-blue-400' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}
            title="Radar Pluie (RainViewer)"
          >
            <CloudRain size={16} className={radarEnabled ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'} />
            <span className="text-[10px] font-black uppercase tracking-widest pr-2 hidden md:block">
              Radar Pluie
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

function createWeatherIconHtml(p) {
  const temp = p.weather ? Math.round(p.weather.temperature_2m) : '?';
  const code = p.weather?.weather_code;
  
  // Simple mapping for map badges
  let icon = "☀️";
  if (code >= 1 && code <= 3) icon = "☁️";
  if (code >= 51 && code <= 67) icon = "🌧️";
  if (code >= 71 && code <= 86) icon = "❄️";
  if (code >= 95) icon = "⚡";

  let badgeColor = "bg-slate-900/95 border-white/10";
  if (p.isStart) badgeColor = "bg-slate-800 border-slate-400/50";
  if (p.isEnd) badgeColor = "bg-slate-800 border-white/50";

  return `
    <div class="relative flex flex-col items-center justify-center translate-y-[-50%] pointer-events-none">
      <div class="flex items-center gap-2 px-3 py-1.5 ${badgeColor} border rounded-lg shadow-2xl text-white font-black text-[11px] backdrop-blur-xl">
        <span class="text-lg opacity-90">${icon}</span>
        <span>${temp}${p.weather ? '°' : ''}</span>
      </div>
      <div class="w-0.5 h-3 bg-white/20 mt-1"></div>
    </div>
  `;
}

function createWeatherPopupHtml(p) {
  const weather = p.weather;
  if (!weather) return `<div class="p-4 text-slate-400 text-[9px] font-black uppercase tracking-widest bg-slate-900 rounded-lg border border-white/5">Données indisponibles</div>`;
  
  return `
    <div class="p-1 min-w-[200px]">
      <div class="text-[8px] text-slate-500 uppercase font-black tracking-[0.3em] mb-4 border-b border-white/5 pb-3">
        ${p.isStart ? 'DÉPART' : p.isEnd ? 'ARRIVÉE' : 'POINT DE PASSAGE'}
      </div>
      <div class="flex items-center justify-between mb-5">
        <div class="text-4xl font-black text-white tracking-tighter">${Math.round(weather.temperature_2m)}°<span class="text-lg text-slate-500 ml-0.5">C</span></div>
        <div class="text-right">
          <div class="text-[8px] text-slate-600 font-black uppercase tracking-tighter">RESSENTI</div>
          <div class="text-sm font-black text-slate-400">${Math.round(weather.apparent_temperature)}°</div>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4 text-[9px]">
        <div class="flex flex-col gap-1">
          <span class="text-slate-600 uppercase font-black tracking-widest">Vent</span>
          <span class="text-white font-black hover:text-slate-300 transition-colors uppercase italic">${Math.round(weather.wind_speed_10m)} <span class="text-[7px] opacity-40">KMH</span></span>
        </div>
        <div class="flex flex-col gap-1 text-right">
          <span class="text-slate-600 uppercase font-black tracking-widest">Humidité</span>
          <span class="text-white font-black uppercase italic">${weather.relative_humidity_2m}<span class="text-[7px] opacity-40">%</span></span>
        </div>
      </div>
    </div>
  `;
}

export default MapContainer;
