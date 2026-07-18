-- Cache permanent des commissariats par ville (résultat Overpass/OSM).
-- Récupérés une seule fois à la première ouverture de la carte, puis servis
-- depuis la base. Rafraîchis au-delà de 180 jours.
-- À exécuter une fois dans le SQL editor de Supabase.

ALTER TABLE us_cities
  ADD COLUMN IF NOT EXISTS police_stations jsonb,
  ADD COLUMN IF NOT EXISTS police_stations_at timestamptz;
