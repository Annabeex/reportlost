-- org-portal-4.sql
--
-- Déclarations de perte faites DIRECTEMENT à un établissement, depuis sa page
-- publique (/o/<slug>, ouverte par le QR code « Lost something? »).
-- Distinctes des déclarations du site (lost_items) : celles-ci appartiennent à
-- l'établissement, son bureau voit le contact de la personne, et elles sont
-- comparées à SON inventaire uniquement.
--
-- À exécuter AVANT de déployer. Relançable sans risque.

create table if not exists org_lost_reports (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  code text not null,                       -- référence courte donnée à la personne
  title text not null,
  description text,
  lost_location text,
  lost_at date not null,
  name text not null,
  email text not null,
  phone text,
  status text not null default 'open',      -- open | closed
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create index if not exists org_lost_reports_org_idx on org_lost_reports (org_id, status);
create index if not exists org_lost_reports_created_idx on org_lost_reports (created_at);

-- Fermée à la clé publique, comme les autres tables du portail.
alter table org_lost_reports enable row level security;
