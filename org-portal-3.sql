-- org-portal-3.sql
--
-- Signalements « gardés par la personne qui a trouvé l'objet ».
-- Quelqu'un trouve un objet sur le campus, ne le dépose pas à l'accueil, mais
-- laisse son e-mail pour que le propriétaire puisse le récupérer auprès de lui.
-- L'établissement ne stocke rien : il sait où est l'objet et met en relation,
-- après avoir vérifié la preuve de propriété.
--
-- À exécuter APRÈS org-portal-2.sql et AVANT de déployer. Relançable sans risque.

alter table org_intakes
  add column if not exists held_by text not null default 'desk';      -- desk | finder

alter table org_intakes drop constraint if exists org_intakes_held_by_check;
alter table org_intakes add constraint org_intakes_held_by_check
  check (held_by in ('desk', 'finder'));

-- Visibilité sur la page publique. Un signalement gardé par son trouveur est
-- listé dès sa création (catégorie générique + date + lieu) ; l'agent peut le
-- masquer. La valeur est posée par la route /api/o/intake, pas par ce défaut.
alter table org_intakes
  add column if not exists public_visible boolean not null default false,
  add column if not exists public_label text;

comment on column org_intakes.held_by is
  'desk = sera remis à l''accueil (code de dépôt) ; finder = gardé par la personne qui l''a trouvé, joignable par e-mail.';

create index if not exists org_intakes_public_idx
  on org_intakes (org_id, held_by, public_visible);

-- L'établissement choisit s'il accepte ce type de signalement.
alter table organizations
  add column if not exists finder_held_enabled boolean not null default true;

comment on column organizations.finder_held_enabled is
  'Si faux, le formulaire « Found something? » ne propose que la remise à l''accueil.';
