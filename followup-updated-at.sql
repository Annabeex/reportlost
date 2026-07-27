-- Horodatage de la dernière mise à jour du compte rendu client
-- ("Last updated" affiché au client + calcul du prochain point à J+14).
-- À exécuter une fois dans le SQL editor de Supabase.

ALTER TABLE lost_items
  ADD COLUMN IF NOT EXISTS case_followup_updated_at timestamptz;
