# 🌍 METEOMAP PRO - Architecture Target & Roadmap

En tant que `/master` (Lead Architect), l'objectif est de transformer le prototype actuel (orienté MVP fonctionnel) en un produit robuste, maintenable et scalable, tout en respectant l'identité visuelle "Grey Elegant".

## 1. Dette Technique Identifiée & Doublons
* **Monolithe Frontend** : Le fichier principal `App.jsx` pèse plus de 350 lignes. Il mixe la vue (UI), la logique métier (calculs de D+), et l'orchestration des appels API réseau.
* **Gestion d'État (State Management)** : L'utilisation basique de `useState` sur un grand nombre de variables (route, weatherPoints, elevationPoints, status) limite la réutilisabilité et ralentit le rendu de React (cascade top-down).
* **Couche Réseau API** : Les appels API dans `api.js` manquent de Retry automatique pour Open-Meteo (qui bloque à 429), de Timeout stricts et de stratégies de cache pour éviter de recharger la même route.
* **Composants CSS & UI** : Beaucoup de classes utilitaires Tailwind sont répétées "en ligne" sur plusieurs composants (boutons, containers), ce qui devrait être abstrait en Design System local.

## 2. Architecture Cible (Modulaire & Évolutive)
Le projet doit adopter une Clean Architecture orientée composants par fonctionnalité (Feature-Sliced Design) :

### Arborescence Projet
```text
src/
├── features/
│   ├── map/           # Composants Leaflet, Layers et Markers
│   ├── weather/       # Timeline météo, HUD, et traitement des prévisions
│   ├── routing/       # Sélecteurs (Départ/Arrivée), Transport
│   └── elevation/     # Graphique D+ SVG et logique de profil
├── shared/
│   ├── ui/            # Boutons, Inputs, Layout (Design System "Grey Elegant")
│   └── lib/           # Utilitaires (timeOffset, math, debounce)
├── store/             # Store Zustand (State externe)
└── app/               # Root, Context Providers, App.jsx allégé
```

### Flux de Données Refactorisé
1. L'Input envoie l'état vers le **Store Global**.
2. Un service asynchrone (potentiellement **React Query**) observe le composant `routing` et déclenche `OSRM`.
3. Dés réception du tracé, le service API déclenche la parallélisation de la Météo + Relief (Promise.all).
4. Le Store est mis à jour en un seul flush pour éviter les re-renders incontrôlés du `MapContainer`.

## 3. Plan Séquentiel d'Exécution & Agents Requis

### Lot 1 : Extraction UI & Design System (Court Terme)
**Agent Requis : `/front` (Lead React)**
* **Objectif** : Vider `App.jsx` de toutes les abstractions UI.
* **Tâches** :
  1. Créer le dossier `components/ui/` ou `shared/ui/`.
  2. Isoler la `Sidebar`, le `SearchPanel`, et le `WeatherTimeline`.
  3. Alléger `App.jsx` à moins de 100 lignes d'orchestration propre.

### Lot 2 : Caching & Robustesse Réseau (Moyen Terme)
**Agents Requis : `/back` & `/pwa`**
* **Objectif** : Stabiliser les appels OSRM et Open-Meteo.
* **Tâches** :
  1. Mettre en place un cache local (SWR ou React Query) pour les trajets et villes.
  2. Implémenter le cache "Service Worker" pour que l'app se charge instantanément offline (PWA renforcée).
  3. Ajouter des intercepteurs de Retry en cas de code 429 sur les API Météo publiques.

### Lot 3 : Nouvelles Vues Pro & Export (Long Terme)
**Agents Requis : `/pm` & `/front`**
* **Objectif** : Livrer des fonctionnalités orientées Sport/Voyage "Pro".
* **Tâches** :
  1. Génération et export d'itinéraire au format GPX (pour Garmin, Strava).
  2. Ajout manuel de "Waypoints" (points de passage cliquables directement sur la map).
  3. Alertes extrêmes (Icônes spécifiques de foudre/tempête ou canicule).

## 4. Checklist de Validation
- [ ] L'application React est modularisée (`App.jsx` < 100 lignes).
- [ ] Zéro prop-drilling profond (utilisation de Store).
- [ ] Réduction de la charge réseau (0 doublons API).
- [ ] L'expérience utilisateur reste parfaitement fluide pendant le refactoring.
