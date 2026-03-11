import { create } from 'zustand';
import { supabase } from '../lib/supabase';

const useAuthStore = create((set, get) => ({
  session: null,
  user: null,
  isInitialized: false,

  initialize: async () => {
    // Obtenir la session initiale
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) console.error("Auth Session Error:", error.message);
    set({ session, user: session?.user || null, isInitialized: true });

    // Écouter les changements d'état d'authentification
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user || null });
    });
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({ session: null, user: null });
  }
}));

export default useAuthStore;
