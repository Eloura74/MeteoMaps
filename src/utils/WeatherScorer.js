/**
 * WeatherScorer - Évalue la qualité d'un itinéraire en fonction de la météo et du terrain.
 */

/**
 * Calcule un score global (0 à 100) pour un itinéraire
 * @param {Object} params - Les données analysées de la route
 * @param {number} params.distance - Distance en mètres
 * @param {number} params.totalAscent - Dénivelé positif cumulé en mètres
 * @param {Array} params.weatherPoints - Points météo le long de la route
 * @returns {number} Score entre 0 et 100
 */
export function calculateRouteScore({ distance, totalAscent, weatherPoints }) {
    let score = 100;
    
    // 1. Pénalité de Terrain (D+)
    if (distance > 0 && totalAscent > 0) {
        const distanceKm = distance / 1000;
        const ascentPerKm = totalAscent / distanceKm; // Mètres montés par km en moyenne
        // Ex: 10m/km = plat (0 pénalité). 25m/km = montagnard (-12.5 pts)
        score -= ascentPerKm * 0.5;
    }
    
    // 2. Pénalités Météorologiques
    if (weatherPoints && weatherPoints.length > 0) {
        let totalRain = 0;
        let maxWind = 0;
        let extremeTempPenalty = 0;

        weatherPoints.forEach(wp => {
            if (wp.weather) {
                totalRain += (wp.weather.precipitation || 0);
                
                if (wp.weather.wind_speed_10m > maxWind) {
                    maxWind = wp.weather.wind_speed_10m;
                }

                // Températures extrêmes (Gel ou Canicule)
                const temp = wp.weather.temperature_2m;
                if (temp > 32) extremeTempPenalty += 2; // -2 pts par heure de canicule
                if (temp < 0) extremeTempPenalty += 2; // -2 pts par heure de gel
            }
        });
        
        // Pénalité Pluie : Une pluie normale c'est 1-2mm/h. 
        // Si on cumule 5mm sur le trajet, c'est très pluvieux.
        score -= (totalRain * 8);
        
        // Pénalité Vent : Le vent gêne surtout au-dessus de 20 km/h
        if (maxWind > 20) {
             score -= (maxWind - 20) * 1.2;
        }

        score -= extremeTempPenalty;
    }
    
    // Clamp entre 0 et 100
    return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Convertit un score numérique en Grade (A+, A, B, C, D, F)
 */
export function getScoreGrade(score) {
    if (score >= 95) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 75) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
}

/**
 * Retourne une couleur Tailwind associée à un Grade
 */
export function getGradeColor(grade) {
    switch (grade) {
        case 'A+': return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10';
        case 'A': return 'text-green-400 border-green-400/30 bg-green-400/10';
        case 'B': return 'text-lime-400 border-lime-400/30 bg-lime-400/10';
        case 'C': return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
        case 'D': return 'text-orange-400 border-orange-400/30 bg-orange-400/10';
        case 'F': default: return 'text-red-500 border-red-500/30 bg-red-500/10';
    }
}
