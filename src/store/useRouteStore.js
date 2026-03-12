import { create } from 'zustand';
import { searchPlaces, getRoute, sampleRoutePoints, getWeatherData, getElevationData } from '../services/api';
import { getVitalPOIs } from '../services/overpass';
import { calculateRouteScore, getScoreGrade, calculateBearing, calculateRelativeWind, calculatePhysicalEffort, getSolarExposure } from '../utils/WeatherScorer';
import { supabase } from '../lib/supabase';

const useRouteStore = create((set, get) => ({
  // State
  waypoints: [
    { id: 'start', query: '', place: null, suggestions: [] },
    { id: 'end', query: '', place: null, suggestions: [] }
  ],
  mode: 'driving',
  routes: [],
  activeRouteIndex: 0,
  weatherPoints: [],
  elevationPoints: [],
  totalAscent: 0,
  pois: [],
  routeScore: null,
  routeScores: [], // Scores pour toutes les alternatives [ { value, grade, label } ]
  physicAnalysis: null, // Données d'effort (Watts, Calories, Temps Corrigé)
  loading: false,
  status: '',
  departureDate: new Date().toISOString().slice(0, 16),
  weatherAlerts: [],
  userRoutes: [], // Bibliothèque des trajets de l'utilisateur

  // Setters
  setMode: (mode) => set({ mode }),
  setDepartureDate: (date) => set({ departureDate: date }),
  setActiveRouteIndex: (index) => {
    set({ activeRouteIndex: index });
    get().calculateRouteDetails(index);
  },

  // Waypoints API
  updateWaypoint: (id, updates) => {
    set({
      waypoints: get().waypoints.map(w => 
        w.id === id ? { ...w, ...updates } : w
      )
    });
  },

  addWaypoint: (index) => {
    const newWaypoints = [...get().waypoints];
    newWaypoints.splice(index + 1, 0, {
      id: Math.random().toString(36).substring(7),
      query: '',
      place: null,
      suggestions: []
    });
    set({ waypoints: newWaypoints });
  },

  removeWaypoint: (id) => {
    const current = get().waypoints;
    if (current.length <= 2) return; // Minimum 2 points (Départ/Arrivée)
    set({ waypoints: current.filter(w => w.id !== id) });
  },

  handleSelectPlace: (id, place) => {
    get().updateWaypoint(id, {
      place: place,
      query: place.fullLabel,
      suggestions: []
    });
  },

  // Actions
  calculateRouteDetails: async (index) => {
    const { routes, departureDate } = get();
    const route = routes[index];
    if (!route) return;

    set({ loading: true, activeRouteIndex: index });
    
    try {
      set({ status: 'Synchronisation temporelle des flux météo...' });
      const sampledWaypoints = sampleRoutePoints(route, 8);
      const baseTs = Math.floor(new Date(departureDate).getTime() / 1000);
      const weatherData = await getWeatherData(sampledWaypoints, baseTs);
      
      // Enrichinement Aero & Solaire
      const enrichedWeather = weatherData.map((wp, idx) => {
          const timestamp = baseTs + (wp.timeOffset || 0);
          
          let aero = { headwind: 0, tailwind: 0, crosswind: 0 };
          if (idx > 0) {
              const prev = weatherData[idx - 1];
              const bearing = calculateBearing(prev.lat, prev.lng, wp.lat, wp.lng);
              aero = calculateRelativeWind(wp.weather.wind_speed_10m, wp.weather.wind_direction_10m, bearing);
          }

          const exposition = getSolarExposure(wp.lat, wp.lng, timestamp, 0, 0); // Pente=0 par défaut ici
          
          return { ...wp, aero, exposition };
      });

      set({ weatherPoints: enrichedWeather });

      set({ status: 'Analyse du relief et dénivelé...' });
      const sampledElevation = sampleRoutePoints(route, 30);
      const elevationData = await getElevationData(sampledElevation);
      set({ elevationPoints: elevationData });

      // Calculate total ascent (D+)
      let ascent = 0;
      for (let i = 1; i < elevationData.length; i++) {
        const diff = elevationData[i].elevation - elevationData[i-1].elevation;
        if (diff > 0) ascent += diff;
      }
      set({ totalAscent: Math.round(ascent) });

      // Calculate Smart Route Score
      const scoreNum = calculateRouteScore({ 
          distance: route.distance, 
          totalAscent: ascent, 
          weatherPoints: weatherData 
      });
      set({ routeScore: { value: scoreNum, grade: getScoreGrade(scoreNum) } });

      set({ status: 'Recherche des points d\'eau et abris...' });
      const poisData = await getVitalPOIs(route.geometry.coordinates);
      set({ pois: poisData });

      // Analyse Physique de l'Effort
      const physical = calculatePhysicalEffort({
          distance: route.distance,
          totalAscent: ascent,
          weatherPoints: enrichedWeather,
          averageSpeedKmh: get().mode === 'bike' ? 22 : get().mode === 'foot' ? 4.5 : 20
      });
      set({ physicAnalysis: physical });

      // Analyze Weather Alerts
      const alerts = [];
      weatherData.forEach((wp, idx) => {
        if (!wp.weather) return;
        const w = wp.weather;
        if (w.wind_speed_10m > 70) alerts.push(`Vent violent (${Math.round(w.wind_speed_10m)} km/h) à l'étape ${idx + 1}`);
        if (w.temperature_2m >= 35) alerts.push(`Chaleur extrême (${Math.round(w.temperature_2m)}°C) à l'étape ${idx + 1}`);
        if (w.weather_code >= 95) alerts.push(`Risques d'orages à l'étape ${idx + 1}`);
        if (w.temperature_2m <= 2 && w.precipitation > 0) alerts.push(`Risque de neige/verglas à l'étape ${idx + 1}`);
      });
      set({ weatherAlerts: alerts });
      
      set({ status: '' });
    } catch (error) {
      console.error(error);
      set({ status: "Erreur lors de l'analyse du trajet." });
    } finally {
      set({ loading: false });
    }
  },

  handleCalculateRoute: async () => {
    const { waypoints, mode, departureDate } = get();
    const validPlaces = waypoints.filter(w => w.place !== null);
    
    if (validPlaces.length < 2) return;

    set({ loading: true, status: "Calcul des itinéraires alternatifs..." });
    
    try {
      const coordinates = validPlaces.map(w => w.place.coordinates);
      const routesData = await getRoute(coordinates, mode);
      
      set({ routes: routesData, activeRouteIndex: 0, status: "Intelligence comparative : Scoring des options..." });

      // Scoring en parallèle de TOUTES les routes pour la recommandation
      const baseTs = Math.floor(new Date(departureDate).getTime() / 1000);
      
      const scoredRoutes = await Promise.all(routesData.map(async (r, i) => {
          const sampled = sampleRoutePoints(r, 6); // Échantillonnage plus léger pour le choix rapide
          const weather = await getWeatherData(sampled, baseTs);
          const scoreNum = calculateRouteScore({ 
              distance: r.distance, 
              totalAscent: 0, // Ignoré pour le scoring rapide (on affinera sur l'active)
              weatherPoints: weather 
          });
          
          let label = "Option " + (i + 1);
          if (i === 0) label = "Principal";
          if (r.duration === Math.min(...routesData.map(rt => rt.duration))) label = "Plus rapide";
          if (r.distance === Math.min(...routesData.map(rt => rt.distance))) label = "Plus court";

          return { value: scoreNum, grade: getScoreGrade(scoreNum), label };
      }));

      set({ routeScores: scoredRoutes });
      
      // Lance l'analyse détaillée sur la route principale
      await get().calculateRouteDetails(0);
      
    } catch (error) {
      console.error(error);
      set({ status: "Erreur lors du calcul de l'itinéraire." });
      set({ loading: false });
    }
  },

  exportGPX: () => {
    const { routes, activeRouteIndex } = get();
    const route = routes[activeRouteIndex];
    if (!route || !route.geometry || !route.geometry.coordinates) return;

    const coords = route.geometry.coordinates;
    let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="MeteoMap Pro">
  <trk>
    <name>MeteoMap Route</name>
    <trkseg>`;
    
    // Add points
    coords.forEach(coord => {
      gpx += `\n      <trkpt lat="${coord[1]}" lon="${coord[0]}"></trkpt>`;
    });

    gpx += `
    </trkseg>
  </trk>
</gpx>`;

    const blob = new Blob([gpx], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MeteoMap_Route_${new Date().toISOString().slice(0,10)}.gpx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  saveRouteToCloud: async (userId, title = 'Mon Itinéraire MeteoMap') => {
    const { routes, activeRouteIndex, waypoints, routeScore } = get();
    const route = routes[activeRouteIndex];
    if (!route || !route.geometry || !userId) return null;

    set({ loading: true, status: 'Sauvegarde dans le cloud...' });
    try {
      const { data, error } = await supabase.from('saved_routes').insert([{
        user_id: userId,
        title,
        geometry: route.geometry,
        waypoints: waypoints.filter(w => w.place), // Nettoyage des waypoints vides
        weather_score: routeScore,
        is_public: true // Rendre semi-public pour le partage par URL
      }]).select();

      if (error) throw error;
      set({ status: 'Itinéraire sauvegardé avec succès !' });
      return data[0];
    } catch (err) {
      console.error("Erreur Sauvegarde Cloud :", err);
      set({ status: 'Erreur lors de la sauvegarde.' });
      return null;
    } finally {
      set({ loading: false });
      setTimeout(() => set({ status: '' }), 3000); // Purge du message de statut après 3s
    }
  },

  loadRouteFromCloud: async (routeId) => {
    set({ loading: true, status: 'Chargement de l\'itinéraire partagé...' });
    try {
      const { data, error } = await supabase
        .from('saved_routes')
        .select('*')
        .eq('id', routeId)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Route introuvable");

      // Reconstruction de l'état
      set({
        waypoints: data.waypoints,
        routes: [{
          distance: data.weather_score?.distance || 0,
          duration: 0, // Optionnel, on n'a pas sauvegardé la durée exacte, on peut l'estimer ou l'ignorer
          geometry: data.geometry,
          summary: data.title
        }],
        activeRouteIndex: 0,
        routeScore: data.weather_score,
        status: 'Itinéraire chargé !',
      });

      // Recalcule les détails (Météo, POIs, Dénivelé) car ils dépendent de l'heure actuelle
      await get().calculateRouteDetails(0);

    } catch (err) {
      console.error("Erreur Chargement Route :", err);
      set({ status: 'Route introuvable ou erreur de chargement.' });
    } finally {
      set({ loading: false });
      setTimeout(() => set({ status: '' }), 4000);
    }
  },

  fetchUserRoutes: async (userId) => {
    if (!userId) return;
    set({ loading: true, status: 'Récupération de vos expéditions...' });
    try {
      const { data, error } = await supabase
        .from('saved_routes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ userRoutes: data || [] });
    } catch (err) {
      console.error("Erreur Fetch Routes :", err);
      set({ status: 'Erreur lors du chargement de la bibliothèque.' });
    } finally {
      set({ loading: false });
    }
  },

  deleteRouteFromCloud: async (routeId, userId) => {
    set({ status: 'Suppression en cours...' });
    try {
      const { error } = await supabase
        .from('saved_routes')
        .delete()
        .eq('id', routeId);

      if (error) throw error;
      
      // Mise à jour locale
      const currentRoutes = get().userRoutes;
      set({ userRoutes: currentRoutes.filter(r => r.id !== routeId) });
      set({ status: 'Expédition supprimée.' });
    } catch (err) {
      console.error("Erreur Delete Route :", err);
      set({ status: 'Erreur lors de la suppression.' });
    } finally {
      setTimeout(() => set({ status: '' }), 3000);
    }
  }
}));

export default useRouteStore;
