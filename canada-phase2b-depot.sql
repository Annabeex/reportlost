-- ============================================================
-- CANADA — phase 2b : ouvrir le dépôt aux villes canadiennes
-- À lancer dans le SQL editor de Supabase AVANT le déploiement du code
-- (le champ ville du formulaire lit ca_cities côté navigateur).
-- Idempotent.
-- ============================================================

-- 1) ca_cities lisible publiquement (noms de villes et populations :
--    données publiques de Statistique Canada, comme us_cities).
DROP POLICY IF EXISTS "ca_cities lecture publique" ON ca_cities;
CREATE POLICY "ca_cities lecture publique" ON ca_cities
  FOR SELECT TO anon, authenticated USING (true);

-- 2) Pays déduit du code de région, quel que soit le chemin d'écriture
--    (formulaire, API, portail, import). Aucun code de province canadienne
--    ne collisionne avec un code d'État américain.
--    ⚠️ Australie (phase 6) : ajouter ici les codes d'États australiens.
CREATE OR REPLACE FUNCTION set_country_from_region() RETURNS trigger
LANGUAGE plpgsql AS $fn$
BEGIN
  NEW.country := CASE
    WHEN upper(btrim(coalesce(NEW.state_id, ''))) IN
         ('AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT') THEN 'CA'
    ELSE 'US'
  END;
  RETURN NEW;
END
$fn$;

DROP TRIGGER IF EXISTS trg_lost_items_country ON lost_items;
CREATE TRIGGER trg_lost_items_country
  BEFORE INSERT OR UPDATE OF state_id ON lost_items
  FOR EACH ROW EXECUTE FUNCTION set_country_from_region();

-- 3) found_items (objets trouvés) : même champ, même règle.
ALTER TABLE found_items ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'US';
UPDATE found_items SET country = 'CA'
WHERE country = 'US'
  AND upper(btrim(coalesce(state_id, ''))) IN ('AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT');

DROP TRIGGER IF EXISTS trg_found_items_country ON found_items;
CREATE TRIGGER trg_found_items_country
  BEFORE INSERT OR UPDATE OF state_id ON found_items
  FOR EACH ROW EXECUTE FUNCTION set_country_from_region();

-- 4) Contrôle
SELECT 'policy ca_cities' AS controle,
       count(*)::text AS valeur
FROM pg_policies WHERE tablename = 'ca_cities' AND policyname = 'ca_cities lecture publique'
UNION ALL
SELECT 'triggers country', string_agg(tgname, ', ')
FROM pg_trigger WHERE tgname IN ('trg_lost_items_country', 'trg_found_items_country')
UNION ALL
SELECT 'lost_items par pays', string_agg(country || '=' || n, ', ')
FROM (SELECT country, count(*) n FROM lost_items GROUP BY country) t
UNION ALL
SELECT 'found_items par pays', string_agg(country || '=' || n, ', ')
FROM (SELECT country, count(*) n FROM found_items GROUP BY country) t;
