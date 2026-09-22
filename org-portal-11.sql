-- org-portal-11.sql — tableau de bord : déclarations de perte « vues », options
-- d'affichage de la liste publique (date, lieu).
-- À exécuter AVANT de déployer. Relançable sans risque.
alter table org_lost_reports add column if not exists seen_at timestamptz;
alter table organizations
  add column if not exists public_show_date  boolean not null default true,
  add column if not exists public_show_place boolean not null default true;
