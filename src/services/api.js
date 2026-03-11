/**
 * API Services for MeteoMap
 * - Geocoding: Photon (OSM)
 * - Routing: OSRM
 * - Weather: Open-Meteo
 */

const PHOTON_URL = 'https://photon.komoot.io/api/';
const OSRM_URL = 'https://router.project-osrm.org/route/v1/';
const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
const ELEVATION_URL = 'https://api.open-meteo.com/v1/elevation';

// Simple in-memory cache to prevent 429 Too Many Requests
const cache = new Map();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

function getCached(key) {
  const item = cache.get(key);
  if (item && Date.now() - item.timestamp < CACHE_TTL) return item.data;
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Get elevation data for multiple points
 * @param {Array} points - Array of {lat, lng}
 * @returns {Promise<Array>} - Elevation data for each point
 */
export async function getElevationData(points) {
  if (!points || points.length === 0) return [];
  
  const lats = points.map(p => p.lat).join(',');
  const lons = points.map(p => p.lng).join(',');
  
  const cacheKey = `elevation_${lats}_${lons}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${ELEVATION_URL}?latitude=${lats}&longitude=${lons}`);
    const data = await response.json();
    const elevations = data.elevation || [];
    
    const result = points.map((p, i) => ({
      ...p,
      elevation: elevations[i] || 0
    }));

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Elevation error:', error);
    return points.map(p => ({ ...p, elevation: 0 }));
  }
}

/**
 * Search for a place using Photon API
 * @param {string} query - The search query
 * @returns {Promise<Array>} - List of suggestions
 */
export async function searchPlaces(query) {
  if (!query || query.length < 3) return [];

  const cacheKey = `search_${query}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${PHOTON_URL}?q=${encodeURIComponent(query)}&limit=5&lang=fr`);
    const data = await response.json();
    const result = data.features.map(f => ({
      id: f.properties.osm_id || Math.random().toString(36),
      name: f.properties.name,
      city: f.properties.city,
      country: f.properties.country,
      coordinates: f.geometry.coordinates, // [lng, lat]
      fullLabel: [f.properties.name, f.properties.city, f.properties.country].filter(Boolean).join(', ')
    }));

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Geocoding error:', error);
    return [];
  }
}

/**
 * Get route between multiple coordinates
 * @param {Array<Array>} points - Array of [lng, lat]
 * @param {string} mode - 'driving', 'bike', 'foot'
 * @returns {Promise<Array>} - Array of OSRM Route data (Alternatives)
 */
export async function getRoute(points, mode = 'driving') {
  if (!points || points.length < 2) throw new Error('At least 2 points required');
  const osrmMode = mode === 'bike' ? 'cycling' : mode === 'foot' ? 'walking' : 'driving';
  const coordsString = points.map(p => `${p[0]},${p[1]}`).join(';');
  const url = `${OSRM_URL}${osrmMode}/${coordsString}?overview=full&geometries=geojson&alternatives=3`;
  
  const cacheKey = `route_${url}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.code !== 'Ok') throw new Error(data.message || 'Routing failed');
    return data.routes; // Return ALL available routes (main + alternatives)
  } catch (error) {
    console.error('Routing error:', error);
    throw error;
  }
}

/**
 * Extract points along the route for weather analysis
 * @param {Object} route - OSRM Route object
 * @param {number} samples - Number of points to extract
 * @returns {Array} - List of coordinates with time offset
 */
export function sampleRoutePoints(route, samples = 10) {
  const geometry = route.geometry;
  const totalDuration = route.duration; // in seconds
  const coords = geometry.coordinates;
  const step = Math.max(1, Math.floor(coords.length / (samples - 1)));
  const points = [];
  
  for (let i = 0; i < samples; i++) {
    const index = Math.min(i * step, coords.length - 1);
    // Linear approximation of time offset (good enough for weather)
    const timeOffset = (index / (coords.length - 1)) * totalDuration;

    points.push({
      lng: coords[index][0],
      lat: coords[index][1],
      isStart: i === 0,
      isEnd: i === samples - 1,
      timeOffset: Math.round(timeOffset)
    });
    if (index === coords.length - 1) break;
  }
  
  return points;
}

/**
 * Get weather data for multiple points in a single request (Batching)
 * Synchronized with travel time
 * @param {Array} points - Array of {lat, lng, timeOffset}
 * @param {number} baseTimestamp - Unix timestamp of departure (optional, defaults to now)
 * @returns {Promise<Array>} - Weather data for each point
 */
export async function getWeatherData(points, baseTimestamp) {
  if (!points || points.length === 0) return [];
  
  const lats = points.map(p => p.lat).join(',');
  const lons = points.map(p => p.lng).join(',');
  
  const cacheKey = `weather_${lats}_${lons}_${baseTimestamp}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    // We fetch hourly data to get predictions along the route duration
    const response = await fetch(`${OPEN_METEO_URL}?latitude=${lats}&longitude=${lons}&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,is_day&wind_speed_unit=kmh&timezone=GMT`);
    const data = await response.json();
    
    // Open-Meteo returns an array if multiple locations are requested
    const results = Array.isArray(data) ? data : [data];
    
    const startTs = baseTimestamp || Math.floor(Date.now() / 1000);

    const finalResult = points.map((p, i) => {
      const locationData = results[i];
      if (!locationData || !locationData.hourly) return { ...p, weather: null };

      // Calculate the arrival time at this point
      const arrivalTimestamp = startTs + (p.timeOffset || 0);
      const arrivalDate = new Date(arrivalTimestamp * 1000);
      const arrivalISO = arrivalDate.toISOString().substring(0, 14) + "00"; // Round to current hour

      // Find the index in the hourly array that matches our arrival hour
      // Open-Meteo hourly.time is like ["2024-03-24T00:00", ...]
      const hourlyIndex = locationData.hourly.time.findIndex(t => t.startsWith(arrivalISO.substring(0, 13)));

      const safeIndex = hourlyIndex !== -1 ? hourlyIndex : 0;
      
      const h = locationData.hourly;
      return {
        ...p,
        weather: {
          temperature_2m: h.temperature_2m[safeIndex],
          relative_humidity_2m: h.relative_humidity_2m[safeIndex],
          apparent_temperature: h.apparent_temperature[safeIndex],
          precipitation: h.precipitation[safeIndex],
          weather_code: h.weather_code[safeIndex],
          wind_speed_10m: h.wind_speed_10m[safeIndex],
          is_day: h.is_day[safeIndex]
        }
      };
    });

    setCache(cacheKey, finalResult);
    return finalResult;
  } catch (error) {
    console.error('Weather error:', error);
    return points.map(p => ({ ...p, weather: null }));
  }
}
