-- Ajout du suivi de vérification humaine des guides ville
-- (publication automatique par lot, relecture a posteriori).
-- À exécuter une fois dans le SQL editor de Supabase.

ALTER TABLE city_guides
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;
