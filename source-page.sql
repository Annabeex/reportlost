-- source-page.sql
--
-- D'où vient un dépôt. Jusqu'ici seul station_slug (QR des commissariats)
-- était retenu : impossible de savoir si un signalement arrive d'une page
-- ville, d'une page catégorie, de l'accueil ou directement de Google.
--
-- Rempli par le formulaire à partir du referrer interne, donc sans avoir à
-- modifier le moindre lien du site. Contenu : un chemin du site
-- (« /lost-and-found/ga/sandy-springs »), « ext:google.com », ou « direct ».
-- Aucune donnée personnelle, aucune chaîne de requête.
--
-- À exécuter AVANT de déployer.

alter table lost_items
  add column if not exists source_page text;

comment on column lost_items.source_page is
  'Page d''où vient le dépôt : chemin interne, ext:<domaine>, ou direct. Pas de query string.';

create index if not exists lost_items_source_page_idx
  on lost_items (source_page);
