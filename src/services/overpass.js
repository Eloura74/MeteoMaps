/**
 * Service pour interroger l'API Overpass d'OpenStreetMap
 * Permet de récupérer les Points d'Intérêt (POIs) vitaux autour d'un itinéraire
 */

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Cache simple pour éviter de spammer l'API Overpass
const overpassCache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 heure

/**
 * Calcule la Bounding Box (boîte englobante) d'un tableau de coordonnées [lng, lat]
 */
function getBoundingBox(coordinates) {
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
  
  coordinates.forEach(([lng, lat]) => {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  });

  // Ajouter une légère marge (~500m à 1km)
  const margin = 0.01; 
  return {
    south: minLat - margin,
    west: minLng - margin,
    north: maxLat + margin,
    east: maxLng + margin
  };
}

/**
 * Calcule la distance approximative (en mètres) entre deux points GPS (Formule Haversine simplifiée)
 */
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Rayon de la terre en mètres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

/**
 * Vérifie si un POI est proche (en mètres) d'au moins un point du tracé géométrique
 */
function isPoiNearRoute(poiLat, poiLng, routeCoordinates, maxDistance = 500) {
  // On échantillonne la route pour ne pas tester 10000 points (1 point sur 10)
  const step = Math.max(1, Math.floor(routeCoordinates.length / 100));
  for (let i = 0; i < routeCoordinates.length; i += step) {
    const [lng, lat] = routeCoordinates[i];
    if (getDistance(poiLat, poiLng, lat, lng) <= maxDistance) {
      return true;
    }
  }
  return false;
}

/**
 * Récupère les POIs (Eau et Abris) vitaux le long d'une route
 * @param {Array} routeCoordinates - Array of [lng, lat]
 * @returns {Promise<Array>} - Liste des POIs filtrés
 */
export async function getVitalPOIs(routeCoordinates) {
  if (!routeCoordinates || routeCoordinates.length === 0) return [];

  // Si le tracé est vraiment trop long (ex: > 500km), on évite de faire planter Overpass
  if (routeCoordinates.length > 20000) return [];

  const bbox = getBoundingBox(routeCoordinates);
  const bboxString = `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;
  
  const cacheKey = `overpass_${bboxString}`;
  const cached = overpassCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data;

  // Requête Overpass QL : On cherche l'eau potable, les sources naturelles, et les abris
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="drinking_water"](${bboxString});
      node["natural"="spring"](${bboxString});
      node["amenity"="shelter"](${bboxString});
      node["tourism"="alpine_hut"](${bboxString});
    );
    out body;
  `;

  try {
    const response = await fetch(OVERPASS_URL, {
      method: 'POST',
      body: query,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    if (!response.ok) throw new Error('Overpass API error');
    
    const data = await response.json();
    
    const pois = data.elements.map(el => ({
      id: el.id,
      lat: el.lat,
      lng: el.lon,
      type: el.tags.amenity || el.tags.natural || el.tags.tourism || 'unknown',
      name: el.tags.name || 'Point non nommé',
      tags: el.tags
    }));

    // Filtrer pour ne garder que ceux qui sont DYNAMIQUEMENT proches du tracé (buffer de 500m)
    // Car la BoundingBox est un rectangle qui peut inclure des POIs très loins de la trace réelle.
    const filteredPOIs = pois.filter(poi => isPoiNearRoute(poi.lat, poi.lng, routeCoordinates, 500));

    // Classifier les POIs pour le front-end
    const enrichedPOIs = filteredPOIs.map(poi => {
      let category = 'other';
      if (['drinking_water', 'spring'].includes(poi.type)) category = 'water';
      if (['shelter', 'alpine_hut'].includes(poi.type)) category = 'shelter';
      
      return { ...poi, category };
    });

    overpassCache.set(cacheKey, { data: enrichedPOIs, timestamp: Date.now() });
    return enrichedPOIs;
    
  } catch (error) {
    console.error("Overpass Service Error:", error);
    return [];
  }
}
