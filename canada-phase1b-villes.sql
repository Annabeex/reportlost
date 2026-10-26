-- ============================================================
-- CANADA — phase 1b : les 5 villes cibles absentes de ca_cities
-- (Barrie, Oshawa, Dieppe, Saguenay, Québec). Idempotent.
--
-- Populations : Statistique Canada, Profil du recensement 2021, niveau
-- subdivision de recensement (municipalité), vérifiées le 26/10/2026 :
--   Barrie   2021A00053543042  147 829
--   Oshawa   2021A00053518013  175 383
--   Dieppe   2021A00051307045   28 114
--   Saguenay 2021A00052494068  144 723
--   Québec   2021A00052423027  549 459
-- lat/lng laissés vides : rien n'est saisi sans source.
-- province_name et timezone sont recopiés d'une ville de la même province
-- déjà en base, pour rester cohérents avec les 37 lignes existantes.
-- ============================================================

-- 1) Québec : si elle existe déjà sous un autre slug (« quebec city »…),
--    on la renomme au lieu de créer un doublon.
UPDATE ca_cities
SET city_ascii = 'quebec',
    city       = 'Quebec City',
    city_fr    = 'Québec',
    population = 549459
WHERE province_id = 'QC'
  AND replace(lower(btrim(city_ascii)), ' ', '-') IN ('quebec-city', 'ville-de-quebec', 'quebec-ville')
  AND NOT EXISTS (SELECT 1 FROM ca_cities WHERE province_id = 'QC' AND city_ascii = 'quebec');

-- 2) Ajout des villes manquantes
INSERT INTO ca_cities (province_id, province_name, city, city_fr, city_ascii, population, timezone)
SELECT
  v.province_id,
  COALESCE(
    (SELECT p.province_name FROM ca_cities p
      WHERE p.province_id = v.province_id AND p.province_name IS NOT NULL LIMIT 1),
    v.province_name_defaut
  ),
  v.city,
  v.city_fr,
  v.city_ascii,
  v.population,
  COALESCE(
    (SELECT p.timezone FROM ca_cities p
      WHERE p.province_id = v.province_id AND p.timezone IS NOT NULL LIMIT 1),
    v.timezone_defaut
  )
FROM (VALUES
  ('ON', 'Ontario',       'Barrie',      NULL,     'barrie',   147829, 'America/Toronto'),
  ('ON', 'Ontario',       'Oshawa',      NULL,     'oshawa',   175383, 'America/Toronto'),
  ('NB', 'New Brunswick', 'Dieppe',      NULL,     'dieppe',    28114, 'America/Moncton'),
  ('QC', 'Quebec',        'Saguenay',    NULL,     'saguenay', 144723, 'America/Toronto'),
  ('QC', 'Quebec',        'Quebec City', 'Québec', 'quebec',   549459, 'America/Toronto')
) AS v(province_id, province_name_defaut, city, city_fr, city_ascii, population, timezone_defaut)
ON CONFLICT (province_id, city_ascii) DO NOTHING;

-- 3) Contrôle : 5 lignes attendues, total 42 (ou 41 si Québec a été renommée)
SELECT province_id, city, city_fr, city_ascii, population, province_name, timezone,
       (SELECT count(*) FROM ca_cities) AS total_ca_cities
FROM ca_cities
WHERE (province_id, city_ascii) IN (('ON','barrie'), ('ON','oshawa'), ('NB','dieppe'), ('QC','saguenay'), ('QC','quebec'))
ORDER BY province_id, city_ascii;
