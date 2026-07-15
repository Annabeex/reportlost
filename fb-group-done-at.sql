-- Horodatage de la création des groupes Facebook (pour le suivi hebdo en admin).
-- À exécuter une fois dans le SQL editor de Supabase.
ALTER TABLE us_cities
  ADD COLUMN IF NOT EXISTS fb_group_done_at timestamptz;

-- Les groupes déjà cochés reçoivent une date de référence (aujourd'hui)
UPDATE us_cities SET fb_group_done_at = now()
WHERE fb_group_done = true AND fb_group_done_at IS NULL;
