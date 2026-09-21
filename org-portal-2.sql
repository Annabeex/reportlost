-- org-portal-2.sql
--
-- Portail établissements, lot 2 :
--   1. échéances de garde : affichage activable par établissement
--   2. références F-#### attribuées par un compteur atomique (plus de doublon
--      quand deux agents enregistrent en même temps, ni après une suppression)
--   3. dépôts par QR code : la personne qui trouve l'objet le décrit elle-même,
--      l'accueil confirme à la remise
--   4. invitations de collègues
--   5. verrouillage : tables du portail fermées à la clé publique, fonctions
--      réservées au serveur
--
-- À exécuter AVANT de déployer. Relançable sans risque.

-- ── 1. Échéances ────────────────────────────────────────────────────────────
alter table organizations
  add column if not exists deadline_tracking boolean;

comment on column organizations.deadline_tracking is
  'Affichage des échéances de garde dans le tableau de bord. NULL = défaut du type (police / city : oui, autres : non).';

-- ── 2. Références ───────────────────────────────────────────────────────────
alter table organizations
  add column if not exists ref_seq integer not null default 0;

-- Reprise de l''existant : le compteur repart du plus grand numéro déjà émis.
update organizations o
set ref_seq = greatest(
  o.ref_seq,
  coalesce((
    select max((substring(f.org_ref from '^F-(\d+)$'))::integer)
    from found_items f
    where f.org_id = o.id
  ), 0),
  (select count(*) from found_items f where f.org_id = o.id)::integer
);

-- Réserve p_n numéros d''un coup et renvoie le DERNIER. Un import de 300
-- lignes réserve 300 numéros en une seule écriture.
create or replace function org_next_ref(p_org uuid, p_n integer default 1)
returns integer
language sql
as $$
  update organizations
  set ref_seq = ref_seq + greatest(coalesce(p_n, 1), 1)
  where id = p_org
  returning ref_seq;
$$;

-- ── 3. Dépôts par QR code ───────────────────────────────────────────────────
-- Table à part, volontairement : tant que l''accueil n''a pas l''objet en main,
-- ce n''est pas de l''inventaire. Rien de ce qui lit found_items (page publique,
-- rapprochement, pages villes) ne peut donc voir un dépôt non confirmé.
create table if not exists org_intakes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  code text not null,                       -- code court montré à l''accueil
  title text not null,
  description text,
  found_location text,
  found_at date not null,
  photo_url text,
  finder_name text,
  finder_email text,
  status text not null default 'pending',   -- pending | confirmed | rejected
  item_id text,                             -- found_items.id une fois confirmé
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists org_intakes_org_status_idx on org_intakes (org_id, status);
create index if not exists org_intakes_created_idx on org_intakes (created_at);

alter table found_items
  add column if not exists intake_id uuid;

comment on column found_items.intake_id is
  'Dépôt par QR code à l''origine de la fiche, s''il y en a un.';

-- ── 4. Invitations ──────────────────────────────────────────────────────────
create table if not exists org_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  email text not null,
  role text not null default 'staff',       -- admin | staff
  token text not null unique,
  invited_by text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz
);

create index if not exists org_invites_org_idx on org_invites (org_id);

-- ── 5. Verrouillage ─────────────────────────────────────────────────────────
-- Toutes ces tables ne sont lues que par les routes serveur (clé service_role,
-- qui ignore la RLS). RLS activée sans aucune policy = la clé publique du site
-- ne peut ni les lire ni les écrire.
alter table organizations   enable row level security;
alter table org_members     enable row level security;
alter table org_item_events enable row level security;
alter table org_ai_usage    enable row level security;
alter table org_matches     enable row level security;
alter table org_intakes     enable row level security;
alter table org_invites     enable row level security;

-- Par défaut, Supabase expose toute fonction à la clé publique : n''importe qui
-- pouvait appeler org_ai_refund en boucle pour remettre un quota à zéro.
revoke execute on function org_next_ref(uuid, integer)   from public, anon, authenticated;
revoke execute on function org_ai_consume(uuid, integer) from public, anon, authenticated;
revoke execute on function org_ai_refund(uuid)           from public, anon, authenticated;
grant  execute on function org_next_ref(uuid, integer)   to service_role;
grant  execute on function org_ai_consume(uuid, integer) to service_role;
grant  execute on function org_ai_refund(uuid)           to service_role;
