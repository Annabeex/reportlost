-- Champ "détail privé vérificateur" (jamais publié, sert à valider les
-- réclamations) + date de naissance facultative (dépôts police).
-- À exécuter une fois dans le SQL editor de Supabase.

ALTER TABLE lost_items
  ADD COLUMN IF NOT EXISTS private_detail text,
  ADD COLUMN IF NOT EXISTS birth_date date;
