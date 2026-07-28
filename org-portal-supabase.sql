-- 🏛️ Portail établissements (phase 1a) : organisations, membres, extension
-- de found_items (inventaire), journal d'audit.
-- À exécuter une fois dans le SQL editor de Supabase.

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'other',          -- police | city | university | hotel | transit | other
  state_id text,
  city text,
  public_email text,
  phone text,
  verified boolean NOT NULL DEFAULT false,     -- page publique visible après validation Anna
  plan text NOT NULL DEFAULT 'free',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS org_members (
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,                       -- auth.users.id
  role text NOT NULL DEFAULT 'admin',          -- admin | staff
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, user_id)
);

-- Inventaire : les objets des établissements vivent dans found_items
-- (même monde que les dépôts publics, même matching plus tard)
ALTER TABLE found_items
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES organizations(id),
  ADD COLUMN IF NOT EXISTS org_ref text,               -- F-0001 par organisation
  ADD COLUMN IF NOT EXISTS storage_location text,      -- étagère B3, casier A1...
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'stored', -- stored | claim_pending | returned | disposed
  ADD COLUMN IF NOT EXISTS legal_deadline date,
  ADD COLUMN IF NOT EXISTS returned_at timestamptz;

CREATE INDEX IF NOT EXISTS found_items_org_idx ON found_items(org_id);

-- Journal d'audit (registre légal automatique)
CREATE TABLE IF NOT EXISTS org_item_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  item_id text NOT NULL,
  type text NOT NULL,          -- created | claim_received | proof_ok | returned | disposed | note
  note text,
  actor_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS org_item_events_item_idx ON org_item_events(item_id);
