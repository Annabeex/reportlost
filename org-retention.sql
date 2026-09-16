-- org-retention.sql
--
-- Durée de conservation propre à l'établissement.
--
-- Jusqu'ici found_items.legal_deadline était calculé avec la loi de l'État,
-- qui encadre la garde PAR LES FORCES DE L'ORDRE. Juste pour un commissariat,
-- faux pour une université, un hôtel ou un aéroport : eux appliquent leur
-- propre politique.
--
-- NULL = « pas réglé ». Les commissariats et mairies restent alors sur la loi
-- de l'État, exactement comme aujourd'hui ; les autres passent sur un repli de
-- 30 jours affiché comme provisoire, à confirmer depuis le tableau de bord.
--
-- À exécuter AVANT de déployer.

alter table organizations
  add column if not exists retention_days integer;

alter table organizations
  add column if not exists retention_set_at timestamptz;

comment on column organizations.retention_days is
  'Durée de garde en jours, politique de l''établissement. NULL = non réglé (loi de l''État pour police/city, 30 jours provisoires sinon).';

alter table organizations
  drop constraint if exists organizations_retention_days_check;

alter table organizations
  add constraint organizations_retention_days_check
  check (retention_days is null or (retention_days between 1 and 3650));
