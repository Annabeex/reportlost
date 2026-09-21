-- org-portal-7.sql — suites du diagnostic de sécurité du 21/09/2026
--
-- Le diagnostic a montré que la clé publique du site ne peut LIRE ni lost_items
-- ni found_items (aucune règle de lecture) : noms, e-mails, téléphones et
-- inventaires ne sont pas exposés. Deux ouvertures restaient en ÉCRITURE.
--
-- À exécuter après org-portal-6.sql. Relançable sans risque.

-- ── 1. found_items : plus d'insertion directe avec la clé publique ──────────
-- La règle « Allow insert for all » laissait n'importe qui créer des lignes dans
-- found_items depuis son navigateur. Le formulaire public « I found an item »
-- n'en a pas besoin : il passe par /api/found-items, côté serveur. Seule la page
-- de test /dashboardmodule (derrière le mot de passe admin) s'en servait.
drop policy if exists "Allow insert for all" on public.found_items;

-- ── 2. Bucket public « images » : des images, et pas trop lourdes ───────────
-- Tout visiteur peut y envoyer un fichier (c'est voulu : photos des
-- déclarations). Mais sans limite de type ni de taille, le bucket pouvait servir
-- à héberger n'importe quoi sous votre adresse Supabase — page piégée, fichier
-- volumineux. Personne ne peut écraser ni supprimer un fichier existant (aucune
-- règle UPDATE / DELETE) : ce point-là était déjà sain.
do $$
begin
  if to_regclass('storage.buckets') is not null then
    update storage.buckets
    set file_size_limit = 15728640, -- 15 Mo : une photo de téléphone non compressée passe
        allowed_mime_types = array['image/jpeg','image/png','image/webp','image/heic','image/heif','image/gif']
    where id = 'images';
  end if;
end $$;
