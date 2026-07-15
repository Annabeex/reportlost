-- Jeton secret par dossier : l'URL publique du compte rendu devient
-- /case/12345?t=<token aléatoire> — fini l'énumération des IDs à 5 chiffres.
-- À exécuter une fois dans le SQL editor de Supabase.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE lost_items
  ADD COLUMN IF NOT EXISTS case_token text NOT NULL DEFAULT encode(gen_random_bytes(12), 'hex');

CREATE UNIQUE INDEX IF NOT EXISTS idx_lost_items_case_token ON lost_items (case_token);
