-- org-portal-8.sql — index, version corrigée d'après le diagnostic du 22/09/2026.
--
-- Ce que le diagnostic a montré : lost_items est déjà bien indexée (public_id,
-- ville+État, fingerprint…) mais porte des DOUBLONS, sans doute des migrations
-- rejouées sous des noms différents : 4 index sur fingerprint, 3 sur public_id,
-- 2 sur email_alias, 2 sur qr_token. Un doublon ne rend rien plus rapide et
-- ralentit chaque écriture. On garde l'index porté par la contrainte (*_key)
-- et on retire les copies.
--
-- Relançable sans risque. Si une ligne échoue parce qu'un nom est en réalité
-- une contrainte, copiez le message à Claude.
do $$
declare n text;
begin
  foreach n in array array[
    'idx_lost_items_fingerprint', 'lost_items_fingerprint_unique', 'ux_lost_items_fingerprint',
    'lost_items_public_id_unique', 'lost_items_public_id_unique_idx',
    'idx_lost_items_email_alias',
    'lost_items_qr_token_idx'
  ] loop
    if exists (select 1 from pg_constraint where conname = n) then
      execute format('alter table lost_items drop constraint %I', n);
    elsif exists (select 1 from pg_indexes where indexname = n) then
      execute format('drop index %I', n);
    end if;
  end loop;
end $$;

-- Ce qui manquait réellement (tri par date, recherche par e-mail, date de perte).
create index if not exists lost_items_created_at_idx  on lost_items (created_at desc);
create index if not exists lost_items_email_idx       on lost_items (email);
create index if not exists lost_items_date_idx        on lost_items (date);
create index if not exists found_items_created_at_idx on found_items (created_at desc);
create index if not exists found_items_org_status_idx on found_items (org_id, status);
create index if not exists found_items_date_idx       on found_items (date);
