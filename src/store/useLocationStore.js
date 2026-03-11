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
        set({
          position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        console.error("Tracking Error:", err);
        set({ error: err.message, isTracking: false });
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
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
