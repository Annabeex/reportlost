-- org-disposition.sql
--
-- Ce que l'objet est devenu, et quand — réellement.
--
-- legal_deadline n'est qu'une ÉLIGIBILITÉ : « à partir d'ici, vous avez le
-- droit de vous en séparer ». Un objet peut rester six mois sur l'étagère
-- après cette date. Rien ne doit donc se déclencher à l'échéance : les
-- horloges de suppression partent du départ réel de l'objet, consigné par un
-- agent.
--
-- À exécuter AVANT de déployer.

alter table found_items add column if not exists disposition text;
alter table found_items add column if not exists disposed_at timestamptz;
alter table found_items add column if not exists disposed_to text;
alter table found_items add column if not exists photo_purged_at timestamptz;

comment on column found_items.disposition is
  'Ce que l''objet est devenu : transferred_police | donated | discarded | returned_owner. NULL tant qu''il est au bureau.';
comment on column found_items.disposed_to is
  'À qui, en clair — « Sandy Springs PD, PV 2026-1183 ». C''est cette ligne qu''on lit à quelqu''un qui se manifeste huit mois plus tard.';
comment on column found_items.photo_purged_at is
  'Date de suppression de la photo. La fiche, elle, reste consultable.';

alter table found_items drop constraint if exists found_items_disposition_check;
alter table found_items add constraint found_items_disposition_check
  check (disposition is null or disposition in
    ('transferred_police','donated','discarded','returned_owner'));

-- Les deux balayages de maintenance filtrent là-dessus.
create index if not exists found_items_disposed_at_idx on found_items (disposed_at);
