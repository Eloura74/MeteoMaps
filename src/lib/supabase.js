import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Supabase credentials manquantes ! Assurez-vous d'avoir créé le fichier .env.local")
}

export const supabase = createClient(supabaseUrl || 'http://placeholder.url', supabaseAnonKey || 'placeholder-key')
