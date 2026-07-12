-- Suivi des groupes Facebook créés par ville
-- À exécuter une fois dans le SQL editor de Supabase.
ALTER TABLE us_cities
  ADD COLUMN IF NOT EXISTS fb_group_done boolean NOT NULL DEFAULT false;
