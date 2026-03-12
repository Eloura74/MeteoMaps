import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, Globe, Map as MapIcon, CloudRain, Wind } from 'lucide-react';
import useLocationStore from '../store/useLocationStore';
import useRouteStore from '../store/useRouteStore';
import WindLayer from './WindLayer';
import RainRadar from './RainRadar';

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
    attribution: '&copy; OpenStreetMap &copy; CartoDB',
    maxNativeZoom: 18
  },
  satellite: {
    name: 'Satellite',
    icon: Globe,
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community',
    maxNativeZoom: 17
  },
  terrain: {
    name: 'Topographie',
    icon: Globe, 
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)',
    maxNativeZoom: 16
  }
};

// POIs Custom Icons
const WaterIcon = L.divIcon({
  html: `<div class="w-7 h-7 bg-blue-500 rounded-full border-2 border-slate-900 flex items-center justify-center text-white shadow-lg shadow-blue-500/20"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-droplets"><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7 2.9 7 2.9s-2.15 5.25-2.29 6.16C3.57 10 3 11.09 3 12.25 3 14.47 4.8 16.3 7 16.3z"/><path d="M15 22.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S15 8.9 15 8.9s-2.15 5.25-2.29 6.16c-.14.91-.71 2-1.71 3.16-1.14.93-1.71 2.03-1.71 3.19 0 2.22 1.8 4.05 4 4.05z"/></svg></div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

const ShelterIcon = L.divIcon({
  html: `<div class="w-7 h-7 bg-amber-600 rounded-full border-2 border-slate-900 flex items-center justify-center text-white shadow-lg shadow-amber-600/20"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-tent"><path d="M3.5 21 14 3"/><path d="M20.5 21 10 3"/><path d="M15.5 21 12 15l-3.5 6"/><path d="M2 21h20"/></svg></div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

const MapContainer = ({ routes = [], activeRouteIndex = 0, onRouteSelect, weatherPoints = [], pois = [], onRegisterCenterFunction }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const markersRef = useRef([]);
  const poiMarkersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const userAccuracyRingRef = useRef(null);
  const ghostMarkerRef = useRef(null);
  
  const [radarEnabled, setRadarEnabled] = useState(false);
  const [windEnabled, setWindEnabled] = useState(false);
  const { position, isTracking, accuracy } = useLocationStore();
  const { 
    activeView, 
    ghostModeActive, 
    ghostPosition,
    setGhostPosition 
  } = useRouteStore();

  useEffect(() => {
    if (!mapInstanceRef.current && mapRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        attributionControl: false
      }).setView([46.2276, 2.2137], 6);

      layerRef.current = L.tileLayer(VIEWS.standard.url, {
        maxNativeZoom: 18,
        maxZoom: 20,
        attribution: VIEWS.standard.attribution
      }).addTo(mapInstanceRef.current);

      L.control.zoom({ position: 'bottomright' }).addTo(mapInstanceRef.current);

      // Hack for Leaflet container size zero during React flex layout
      setTimeout(() => {
        if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
      }, 300);

      // Enregistre la fonction de ciblage vers le parent
      if (onRegisterCenterFunction) {
        onRegisterCenterFunction((coords) => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
            mapInstanceRef.current.flyTo(coords, 16, { animate: true, duration: 1 });
          }
        });
      }
    }
  }, [onRegisterCenterFunction]);

  // Update TileLayer when view changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      if (layerRef.current) {
        mapInstanceRef.current.removeLayer(layerRef.current);
      }
      
      const config = VIEWS[activeView] || VIEWS.standard;
      layerRef.current = L.tileLayer(config.url, {
        maxNativeZoom: config.maxNativeZoom || 18,
        maxZoom: 20,
        attribution: config.attribution
      }).addTo(mapInstanceRef.current);
    }
  }, [activeView]);

  // Ghost Mode Animation & Marker Management
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Reset periodic
    if (!ghostModeActive) {
      if (ghostMarkerRef.current) {
        mapInstanceRef.current.removeLayer(ghostMarkerRef.current);
        ghostMarkerRef.current = null;
      }
      setGhostPosition(null);
      return;
    }

    // Initialize Marker if needed
    if (!ghostMarkerRef.current) {
      const ghostIcon = L.divIcon({
        html: `<div style="width:40px; height:40px; background:rgba(255,255,255,0.1); backdrop-filter:blur(12px); border-radius:50%; border:2px solid rgba(255,255,255,0.4); display:flex; align-items:center; justify-center; color:white; box-shadow:0 0 20px rgba(255,255,255,0.3); animation: pulse 2s infinite;">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/><path d="M9 10h.01"/><path d="M15 10h.01"/></svg>
               </div>`,
        className: 'ghost-marker-div',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });
      ghostMarkerRef.current = L.marker([0, 0], { icon: ghostIcon, zIndexOffset: 2000 }).addTo(mapInstanceRef.current);
    }

    let interval;
    if (routes[activeRouteIndex]?.geometry?.coordinates) {
      const coords = routes[activeRouteIndex].geometry.coordinates;
      let step = 0;
      
      interval = setInterval(() => {
        if (step >= coords.length) {
          step = 0;
        }
        const point = coords[step];
        const newPos = [point[1], point[0]];
        
        if (ghostMarkerRef.current) {
          ghostMarkerRef.current.setLatLng(newPos);
        }
        setGhostPosition(newPos);
        
        step += Math.max(1, Math.floor(coords.length / 120)); // Vitesse de preview (boucle en ~6s)
      }, 50);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [ghostModeActive, routes, activeRouteIndex, setGhostPosition]);

  // Live GPS Tracking Render
  useEffect(() => {
    console.log("🗺️ MapContainer.jsx -> GPS Tracker Update", { position, isTracking, accuracy, hasMap: !!mapInstanceRef.current });
    
    if (!mapInstanceRef.current || !position || !isTracking) {
      if (userMarkerRef.current) {
        console.log("🗺️ Suppression du marqueur GPS");
        mapInstanceRef.current.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }
      if (userAccuracyRingRef.current) {
        mapInstanceRef.current.removeLayer(userAccuracyRingRef.current);
        userAccuracyRingRef.current = null;
      }
      return;
    }

    const posLatLng = [position.lat, position.lng];
    console.log("🗺️ Création/Update du marqueur GPS à :", posLatLng);

    // Create or update marker
    if (!userMarkerRef.current) {
      // Create user dot (avec styles inlines stricts pour bypasser la purge éventuelle de Tailwind css sur les strings injectées)
      const userIcon = L.divIcon({
        className: 'user-gps-marker',
        html: `<div style="position:relative; width:20px; height:20px; border-radius:50%; background-color:#3b82f6; border:3px solid white; box-shadow: 0 0 15px rgba(59,130,246,0.8);">
                 <div style="position:absolute; top:0; left:0; right:0; bottom:0; border-radius:50%; background-color:#60a5fa; animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.75;"></div>
               </div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      userMarkerRef.current = L.marker(posLatLng, { icon: userIcon, zIndexOffset: 1000 }).addTo(mapInstanceRef.current);
      
      // Auto-center on first fix
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
        mapInstanceRef.current.flyTo(posLatLng, 15, { animate: true, duration: 1 });
      }
    } else {
      userMarkerRef.current.setLatLng(posLatLng);
    }

    // Create or update accuracy ring
    if (accuracy) {
      if (!userAccuracyRingRef.current) {
        userAccuracyRingRef.current = L.circle(posLatLng, {
          radius: accuracy,
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.1,
          weight: 1,
          dashArray: '4,4'
        }).addTo(mapInstanceRef.current);
      } else {
        userAccuracyRingRef.current.setLatLng(posLatLng);
        userAccuracyRingRef.current.setRadius(accuracy);
      }
    }
    
  }, [position, isTracking, accuracy]);

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

  // RainRadar is now a separate component rendering its own TileLayer


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

  // Effect for POIs
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear previous POI markers
    poiMarkersRef.current.forEach(m => mapInstanceRef.current.removeLayer(m));
    poiMarkersRef.current = [];

    if (pois && pois.length > 0) {
      pois.forEach(poi => {
        const icon = poi.category === 'water' ? WaterIcon : ShelterIcon;
        const popupHtml = `
          <div class="text-center font-sans tracking-tight p-2">
            <div class="font-bold text-slate-800 text-[13px] uppercase tracking-wide mb-1">${poi.name}</div>
            <div class="text-[10px] text-slate-500 font-semibold">${poi.category === 'water' ? "Point d'Eau" : "Refuge / Abri"}</div>
          </div>
        `;
        const marker = L.marker([poi.lat, poi.lng], { icon })
          .bindPopup(popupHtml, { className: 'meteo-popup' })
          .addTo(mapInstanceRef.current);
          
        poiMarkersRef.current.push(marker);
      });
    }
  }, [pois]);

  return (
    <div className="h-full w-full relative z-10">
      <div ref={mapRef} className="h-full w-full" />
      
      {/* Dynamic Layers */}
      <WindLayer 
        map={mapInstanceRef.current} 
        weatherPoints={weatherPoints} 
        enabled={windEnabled} 
      />

      <RainRadar map={mapInstanceRef.current} enabled={radarEnabled} />
      
      {/* HUD Layer Control */}
      <div className="absolute top-6 right-6 z-[1000] flex flex-col gap-3">
        <div className="bg-zinc-950/60 backdrop-blur-3xl border border-white/10 rounded-2xl p-2 shadow-2xl flex flex-col gap-1.5 min-w-[50px]">
          {Object.entries(VIEWS).map(([key, view]) => {
            const Icon = view.icon;
            return (
              <button
                key={key}
                onClick={() => useRouteStore.getState().setActiveView(key)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative ${activeView === key ? 'bg-zinc-700 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'}`}
                title={view.name}
              >
                <Icon size={18} className={activeView === key ? 'scale-110' : 'group-hover:scale-110 transition-transform'} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] pr-2 hidden lg:block">
                  {view.name}
                </span>
                {activeView === key && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-blue-500 rounded-full" />
                )}
              </button>
            );
          })}
          
          <div className="h-px w-full bg-white/5 my-1"></div>
          
          <button
            onClick={() => setRadarEnabled(!radarEnabled)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group ${radarEnabled ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20 shadow-lg' : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'}`}
            title="Radar Pluie"
          >
            <CloudRain size={18} className={radarEnabled ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] pr-2 hidden lg:block">
              Radar Pluie
            </span>
          </button>

          <button
            onClick={() => setWindEnabled(!windEnabled)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group ${windEnabled ? 'bg-teal-500/20 text-teal-400 border border-teal-500/20 shadow-lg' : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'}`}
            title="Flux de Vent"
          >
            <Wind size={18} className={windEnabled ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] pr-2 hidden lg:block">
              Flux de Vent
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

  let badgeColor = "bg-zinc-950/80 border-white/20";
  if (p.isStart) badgeColor = "bg-blue-900 border-blue-400/50";
  if (p.isEnd) badgeColor = "bg-emerald-900 border-emerald-400/50";

  return `
    <div class="relative flex flex-col items-center justify-center translate-y-[-50%] pointer-events-none drop-shadow-2xl scale-[1.1]">
      <div class="flex items-center gap-2 px-3.5 py-2 ${badgeColor} border rounded-[1.2rem] shadow-2xl text-white font-black text-[12px] backdrop-blur-2xl">
        <span class="text-xl leading-none">${icon}</span>
        <span class="tracking-tighter">${temp}${p.weather ? '°' : ''}</span>
      </div>
      <div class="w-1 h-4 bg-zinc-100/30 mt-1 rounded-full"></div>
    </div>
  `;
}

function createWeatherPopupHtml(p) {
  const weather = p.weather;
  if (!weather) return `<div class="p-4 text-zinc-400 text-[10px] font-black uppercase tracking-widest bg-zinc-950 rounded-2xl border border-white/5">Données indisponibles</div>`;
  
  return `
    <div class="p-2 min-w-[220px] bg-zinc-950/20">
      <div class="text-[9px] text-zinc-500 uppercase font-black tracking-[0.3em] mb-5 border-b border-white/10 pb-4">
        ${p.isStart ? 'ZONE DE DÉPART' : p.isEnd ? 'DESTINATION' : 'POINT DE PASSAGE'}
      </div>
      <div class="flex items-center justify-between mb-6">
        <div class="text-5xl font-black text-white tracking-tighter">${Math.round(weather.temperature_2m)}°<span class="text-xl text-zinc-600 ml-1">C</span></div>
        <div class="text-right">
          <div class="text-[9px] text-zinc-600 font-black uppercase tracking-tighter mb-1">RESSENTI</div>
          <div class="text-lg font-black text-blue-400">${Math.round(weather.apparent_temperature)}°</div>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-6">
        <div class="flex flex-col gap-1.5">
          <span class="text-[8px] text-zinc-600 uppercase font-black tracking-widest">Vent de face</span>
          <span class="text-white font-black text-[13px] italic">${Math.round(weather.wind_speed_10m)} <span class="text-[8px] opacity-40 font-bold">KM/H</span></span>
        </div>
        <div class="flex flex-col gap-1.5 text-right">
          <span class="text-[8px] text-zinc-600 uppercase font-black tracking-widest">Humidité</span>
          <span class="text-white font-black text-[13px] italic">${weather.relative_humidity_2m}<span class="text-[8px] opacity-40 font-bold">%</span></span>
        </div>
      </div>
    </div>
  `;
}

export default MapContainer;
