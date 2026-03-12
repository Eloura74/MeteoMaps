/**
 * WeatherScorer - Évalue la qualité d'un itinéraire en fonction de la météo et du terrain.
 */

/**
 * Calcule un score global (0 à 100) pour un itinéraire
 * @param {Object} params - Les données analysées de la route
 * @param {number} params.distance - Distance en mètres
 * @param {number} params.totalAscent - Dénivelé positif cumulé en mètres
 * @param {Array} params.weatherPoints - Points météo le long de la route
 * @param {Array} params.weatherPoints - Points météo le long de la route (doit inclure lat/lng pour le calcul du vent relatif)
 * @returns {number} Score entre 0 et 100
 */
export function calculateRouteScore({ distance, totalAscent, weatherPoints }) {
    let score = 100;
    
    // 1. Pénalité de Terrain (D+)
    if (distance > 0 && totalAscent > 0) {
        const distanceKm = distance / 1000;
        const ascentPerKm = totalAscent / distanceKm; 
        score -= Math.min(40, ascentPerKm * 0.5); // Cap à 40 pts de pénalité max
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
        // On affine ici en tenant compte du vent FACE
        let avgHeadwind = 0;
        let windPointsCount = 0;

        weatherPoints.forEach((wp, idx) => {
            if (wp.weather && weatherPoints[idx - 1]) {
                const prev = weatherPoints[idx - 1];
                const bearing = calculateBearing(prev.lat, prev.lng, wp.lat, wp.lng);
                const relWind = calculateRelativeWind(wp.weather.wind_speed_10m, wp.weather.wind_direction_10m, bearing);
                
                if (relWind.headwind > 0) {
                    avgHeadwind += relWind.headwind;
                    windPointsCount++;
                }
            }
        });

        const finalHeadwind = windPointsCount > 0 ? avgHeadwind / windPointsCount : maxWind * 0.5; // Fallback si pas de segments

        if (finalHeadwind > 15) {
             score -= (finalHeadwind - 15) * 1.5;
        }

        score -= extremeTempPenalty;
    }
    
    // Clamp entre 0 et 100
    return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Calcule l'angle de direction entre deux points (en degrés)
 */
export function calculateBearing(lat1, lon1, lat2, lon2) {
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) -
              Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    
    const θ = Math.atan2(y, x);
    return (θ * 180 / Math.PI + 360) % 360; // 0-360 degrés
}

/**
 * Calcule les composantes de vent relatif (Face et Travers)
 * @param {number} windSpeed - Vitesse du vent (km/h)
 * @param {number} windDir - Direction d'où vient le vent (degrés)
 * @param {number} travelDir - Direction du trajet (degrés)
 */
export function calculateRelativeWind(windSpeed, windDir, travelDir) {
    // Différence d'angle entre la direction du vent et la direction opposée au trajet
    // windDir est la direction d'OÙ vient le vent.
    // Si windDir == travelDir, le vent vient de l'arrière (Tailwind).
    // Si windDir == (travelDir + 180) % 360, le vent est de face (Headwind).
    
    const diff = (windDir - travelDir + 360) % 360;
    const diffRad = (diff * Math.PI) / 180;
    
    // Composante longitudinale (Positive = Headwind, Négative = Tailwind)
    const headwind = -windSpeed * Math.cos(diffRad);
    // Composante latérale (Crosswind)
    const crosswind = Math.abs(windSpeed * Math.sin(diffRad));

    return {
        headwind: Math.max(0, headwind), // On ne garde que la résistance de face ici
        tailwind: Math.max(0, -headwind),
        crosswind
    };
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

/**
 * Calcule l'impact physique ( Effort / Watts / Temps )
 */
export function calculatePhysicalEffort({ distance, totalAscent, weatherPoints, averageSpeedKmh = 20 }) {
    if (!distance || distance <= 0 || !weatherPoints || weatherPoints.length < 2) {
        return { correctedDuration: 0, calories: 0, avgWatts: 0, penaltyMinutes: 0 };
    }
    // Constantes physiques simplifiées (base cycliste moyen)
    const mass = 85; 
    const g = 9.81;
    const Rho = 1.225;
    const CdA = 0.4;
    const Crr = 0.005;

    let totalJoules = 0;
    let totalSecondsNormal = distance / (averageSpeedKmh / 3.6);
    let totalSecondsWithPenalty = 0;

    // Analyse par segment (weatherPoints sont nos échantillons)
    for (let i = 1; i < weatherPoints.length; i++) {
        const p1 = weatherPoints[i-1];
        const p2 = weatherPoints[i];
        
        const segmentDist = distance / (weatherPoints.length - 1); // Approximation
        const segmentAscent = (totalAscent / (weatherPoints.length - 1)); // Approximation splitte
        const slope = segmentAscent / segmentDist;

        const v = averageSpeedKmh / 3.6; // Vitesse cible en m/s
        const headwind = (p2.aero?.headwind || 0) / 3.6; // m/s
        
        // Puissance nécessaire (Watts)
        const pGrav = mass * g * v * slope;
        const pRoll = mass * g * v * Crr;
        const pAir = 0.5 * CdA * Rho * Math.pow(v + headwind, 2) * v;
        
        const powerTotal = Math.max(0, pGrav + pRoll + pAir);
        
        // Coût énergétique du segment (Joules = Watts * secondes)
        const segmentTime = segmentDist / v;
        totalJoules += powerTotal * segmentTime;

        // Calcul du ralentissement (Approximation : le vent de face et la pente allongent le temps)
        // Facteur de peine : Si Power > Power_Base, le temps augmente
        const powerBase = mass * g * v * Crr + 0.5 * CdA * Rho * Math.pow(v, 2) * v;
        const penaltyFactor = powerTotal / Math.max(1, powerBase);
        
        // On limite la pénalité pour ne pas avoir des temps infinis
        const cappedPenalty = Math.min(2.5, penaltyFactor); 
        totalSecondsWithPenalty += segmentTime * cappedPenalty;
    }

    const totalKcal = totalJoules / 4184 / 0.24; 

    return {
        correctedDuration: Math.round(totalSecondsWithPenalty) || Math.round(totalSecondsNormal),
        calories: Math.round(totalKcal) || 0,
        avgWatts: Math.round(totalJoules / Math.max(1, totalSecondsNormal)) || 0,
        penaltyMinutes: Math.round((totalSecondsWithPenalty - totalSecondsNormal) / 60) || 0
    };
}

/**
 * Calcule la position du soleil (Azimuth et Élévation)
 */
export function calculateSolarPosition(lat, lng, timestamp) {
    const date = new Date(timestamp * 1000);
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    
    // Déclinaison (radians)
    const delta = 23.45 * Math.sin((360 / 365) * (dayOfYear - 81) * Math.PI / 180) * Math.PI / 180;
    
    // Angle horaire (H)
    const hour = date.getUTCHours() + date.getUTCMinutes() / 60;
    const h = (hour - 12) * 15 * Math.PI / 180;
    
    const phi = lat * Math.PI / 180;
    
    // Élévation
    const elevation = Math.asin(Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.cos(h));
    
    // Azimuth
    const azimuth = Math.acos((Math.sin(delta) - Math.sin(phi) * Math.sin(elevation)) / (Math.cos(phi) * Math.cos(elevation)));
    
    return {
        elevation: elevation * 180 / Math.PI,
        azimuth: (h > 0 ? 360 - (azimuth * 180 / Math.PI) : azimuth * 180 / Math.PI) % 360
    };
}

/**
 * Estime si le point est à l'ombre ou au soleil
 */
export function getSolarExposure(lat, lng, timestamp, slope, aspect) {
    const sun = calculateSolarPosition(lat, lng, timestamp);
    
    if (sun.elevation < 2) return 'Nuit';
    if (sun.elevation < 10) return 'Aube/Crépuscule';

    // Analyse d'ombre portée simplifiée :
    // Si la pente est forte (> 15%) et que le soleil est derrière la montagne
    // On compare l'azimuth du soleil et l'orientation de la pente (aspect)
    const aspectDiff = Math.abs(sun.azimuth - aspect);
    if (slope > 0.15 && aspectDiff > 120 && aspectDiff < 240 && sun.elevation < 30) {
        return 'Ombre';
    }
    
    return 'Ensoleillé';
}

/**
 * Le Narrateur IA : Génère un briefing en langage naturel basé sur les données
 */
export function generateRouteBriefing({ score, weatherPoints, effort, mode }) {
    if (!score || !weatherPoints || weatherPoints.length === 0) return null;

    let briefing = "";
    const mainConditions = weatherPoints.map(p => p.weather?.weather_code || 0);
    const isRainy = mainConditions.some(c => c >= 51);
    const isStormy = mainConditions.some(c => c >= 95);
    const avgTemp = weatherPoints.reduce((acc, p) => acc + (p.weather?.temperature_2m || 0), 0) / weatherPoints.length;
    
    // 1. Synthèse globale
    if (score.value >= 80) briefing += "Conditions idéales ! ";
    else if (score.value >= 60) briefing += "Itinéraire correct, mais quelques points d'attention. ";
    else briefing += "Parcours exigeant, prudence recommandée. ";

    // 2. Analyse Vent & Effort (Ignoré en voiture)
    if (mode !== 'driving') {
        if (effort.penaltyMinutes > 15) {
            briefing += `Le vent de face va sérieusement durcir l'effort (+${effort.penaltyMinutes} min sur votre temps habituel). `;
        } else if (weatherPoints.some(p => p.aero?.tailwind > 15)) {
            briefing += "Profitez d'un bel appui du vent de dos pendant une partie du trajet. ";
        }
    } else {
        // Mode voiture : focus sur la visibilité/sécurité
        if (weatherPoints.some(p => p.weather?.wind_speed_10m > 40)) {
            briefing += "Fortes rafales de vent : attention à la prise au vent de votre véhicule. ";
        }
    }

    // 3. Analyse Météo
    if (isStormy) briefing += "⚠️ Attention : Risques d'orages détectés sur votre passage ! ";
    else if (isRainy) briefing += "Prévoyez une conduite prudente, la pluie s'invitera sur le parcours. ";
    
    if (avgTemp > 30) briefing += mode === 'driving' ? "Forte chaleur : vérifiez la climatisation et restez hydraté. " : "Forte chaleur prévue : assurez votre hydratation. ";
    else if (avgTemp < 5) briefing += "Températures froides : attention aux risques de verglas localisés. ";

    // 4. Analyse Solaire
    const shadowSegments = weatherPoints.filter(p => p.exposition === 'Ombre').length;
    if (shadowSegments > weatherPoints.length * 0.5) {
        briefing += "Le parcours sera majoritairement ombragé par le relief. ";
    } else if (weatherPoints.some(p => p.exposition === 'Nuit')) {
        briefing += "Notez qu'une partie du trajet s'effectuera à la nuit tombée. ";
    }

    // 5. Nutrition & Ravitaillement (Epic 14)
    // Le plan de ravitaillement est maintenant calculé en amont et passé via 'effort.fueling'
    if (effort.fueling && effort.fueling.recommendation) {
        briefing += effort.fueling.recommendation;
    }

    return briefing;
}

/**
 * Calcule un plan de ravitaillement basé sur l'effort et les POIs
 */
export function calculateFuelingPlan({ calories, correctedDuration, pois, mode }) {
    if (!calories || !pois) return null;

    if (mode === 'driving') {
        return {
            waterNeededLiters: 0,
            recommendation: "Trajet motorisé : prévoyez simplement une boisson de confort.",
            waterPoisCount: 0,
            shelterPoisCount: 0
        };
    }

    const waterPois = pois.filter(p => p.category === 'water');
    const shelterPois = pois.filter(p => p.category === 'shelter');
    
    // Règle de base : 500ml d'eau par heure d'effort intense (ou tous les 600 kcal)
    const waterNeededLiters = (calories / 600) * 0.5;
    
    let recommendation = "";
    if (waterNeededLiters > 1.5 && waterPois.length > 0) {
        recommendation = `Prévoyez d'importantes réserves d'eau (${waterNeededLiters.toFixed(1)}L estimé). `;
        const firstWater = waterPois[0];
        recommendation += `Premier point d'eau détecté : "${firstWater.name}". `;
    } else if (waterNeededLiters > 0.5 && waterPois.length === 0) {
        recommendation = "Attention : Aucun point d'eau potable détecté sur le tracé. Partez avec vos réserves. ";
    }

    return {
        waterNeededLiters,
        recommendation,
        waterPoisCount: waterPois.length,
        shelterPoisCount: shelterPois.length
    };
}

/**
 * Formate une durée en secondes en une chaîne HHhMM
 * @param {number} seconds 
 * @returns {string}
 */
export function formatDuration(seconds) {
    if (!seconds || seconds <= 0) return "0min";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h${m.toString().padStart(2, '0')}`;
    return `${m}min`;
}

/**
 * Calcule la distance approximative (en mètres) entre deux points GPS (Formule Haversine simplifiée)
 */
export function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Rayon de la terre en mètres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * Calcule la distance totale d'un itinéraire basé sur ses coordonnées
 * @param {Array} coordinates - Tableau de [lng, lat]
 * @returns {number} Distance totale en mètres
 */
export function calculateTotalDistance(coordinates) {
    if (!coordinates || coordinates.length < 2) return 0;
    let total = 0;
    for (let i = 1; i < coordinates.length; i++) {
        const [lon1, lat1] = coordinates[i - 1];
        const [lon2, lat2] = coordinates[i];
        total += getDistance(lat1, lon1, lat2, lon2);
    }
    return total;
}
