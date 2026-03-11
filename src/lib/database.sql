-- Déploiement Initial de la Base de Données MeteoMap (Supabase)
-- Copiez-collez ce code dans le "SQL Editor" de votre projet Supabase.

-- 1. Table des Profils Utilisateurs (Liée à auth.users)
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  updated_at timestamp with time zone,
  username text UNIQUE,
  full_name text,
  avatar_url text
);

-- 2. Configuration RLS (Row Level Security) pour `profiles`
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone." ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." ON profiles
  FOR UPDATE USING (auth.uid() = id);


-- 3. Table des Itinéraires Sauvegardés (saved_routes)
CREATE TABLE public.saved_routes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  title text,
  description text,
  geometry jsonb NOT NULL,      -- Le tracé GeoJSON (LineString)
  waypoints jsonb NOT NULL,     -- Les points (Départ, Arrivée, Intermédiaires)
  weather_score jsonb,          -- Résultat du WeatherScorer (A, B, C...)
  is_public boolean DEFAULT false
);

-- 4. Configuration RLS (Row Level Security) pour `saved_routes`
ALTER TABLE public.saved_routes ENABLE ROW LEVEL SECURITY;

-- Les routes publiques sont lisibles par tous
CREATE POLICY "Public routes are viewable by everyone" ON saved_routes
  FOR SELECT USING (is_public = true);

-- Un utilisateur peut lire TOUTES ses routes (publiques et privées)
CREATE POLICY "Users can view their own routes" ON saved_routes
  FOR SELECT USING (auth.uid() = user_id);

-- Un utilisateur peut insérer ses propres routes
CREATE POLICY "Users can create their own routes" ON saved_routes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Un utilisateur peut modifier ses propres routes
CREATE POLICY "Users can update their own routes" ON saved_routes
  FOR UPDATE USING (auth.uid() = user_id);

-- Un utilisateur peut supprimer ses propres routes
CREATE POLICY "Users can delete their own routes" ON saved_routes
  FOR DELETE USING (auth.uid() = user_id);


-- 5. Trigger automatisé : Créer un profil quand un user s'inscrit
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
