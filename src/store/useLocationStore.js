import { create } from 'zustand';

const useLocationStore = create((set, get) => ({
  position: null, // { lat, lng }
  heading: null,
  speed: null,
  accuracy: null,
  isTracking: false,
  error: null,
  watchId: null,

  startTracking: () => {
    if (get().watchId) return; // Déjà en cours

    if (!navigator.geolocation) {
      set({ error: "La géolocalisation n'est pas supportée par votre navigateur" });
      return;
    }

    set({ isTracking: true, error: null });

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        console.log("📍 Position GPS reçue !", pos.coords);
        set({
          position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        let errorMsg = "Erreur GPS Inconnue";
        if (err.code === 1) errorMsg = "Permission refusée par l'utilisateur ou le navigateur.";
        if (err.code === 2) errorMsg = "Position introuvable (pas de signal/réseau).";
        if (err.code === 3) errorMsg = "Le délai de localisation a expiré.";
        
        console.error("Tracking Error:", err.code, err.message, errorMsg);
        set({ error: errorMsg, isTracking: false });
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 20000, // 20s
      }
    );

    set({ watchId });
  },

  stopTracking: () => {
    const { watchId } = get();
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      set({ watchId: null, isTracking: false });
    }
  },
}));

export default useLocationStore;
