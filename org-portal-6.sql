-- org-portal-6.sql — sécurité du portail établissements
--
--   1. bucket PRIVÉ pour les photos d'inventaire (fermé à la clé publique)
--   2. found_items : les lignes d'un établissement deviennent illisibles avec
--      la clé publique du site, QUEL QUE SOIT l'état actuel de la table
--
-- À exécuter AVANT de déployer. Relançable sans risque.

-- ── 1. Bucket privé ─────────────────────────────────────────────────────────
-- Aucune policy n'est créée sur ce bucket, exprès : sans policy, seule la clé
-- service_role (le serveur) peut y lire ou y écrire. L'affichage passe par des
-- liens signés à durée limitée (lib/orgPhotos.ts).
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public)
    values ('org-private', 'org-private', false)
    on conflict (id) do update set public = false;
  end if;
end $$;

-- ── 2. found_items ──────────────────────────────────────────────────────────
-- Le site public lit found_items avec la clé publique (pages villes, catégories).
-- Cette clé est visible de tous dans le code du site : avec elle, n'importe qui
-- pouvait demander directement à la base les lignes des établissements —
-- description privée, emplacement de stockage, adresse de la photo.
--
-- Étape A — si la table n'avait aucune protection par ligne, on l'active en
-- conservant exactement ce que le site public faisait : LIRE. (Les écritures
-- du site passent toutes par le serveur, qui ignore ces règles.)
do $$
begin
  if not (select relrowsecurity from pg_class where oid = 'public.found_items'::regclass) then
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'found_items' and policyname = 'found_items_public_read') then
      create policy found_items_public_read on public.found_items
        for select to anon, authenticated using (true);
    end if;
    alter table public.found_items enable row level security;
  end if;
end $$;

-- Étape B — règle RESTRICTIVE : elle s'ajoute à toutes les autres avec un ET.
-- Quelles que soient les règles déjà en place, la clé publique ne voit, ne crée
-- et ne modifie que des lignes SANS établissement. Impossible aussi de glisser
-- un faux objet dans l'inventaire d'une université.
drop policy if exists found_items_org_rows_private on public.found_items;
create policy found_items_org_rows_private on public.found_items
  as restrictive for all to anon, authenticated
  using (org_id is null)
  with check (org_id is null);
