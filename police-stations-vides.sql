-- police-stations-vides.sql
-- Cartes US : efface les « aucun poste de police » enregistrés après un échec d'Overpass.
-- Chaque ville concernée refera sa recherche à la prochaine visite.

-- 1) Combien de villes sont concernées (avant)
SELECT count(*) AS villes_vides
FROM us_cities
WHERE police_stations = '[]'::jsonb;

-- 2) Effacement
UPDATE us_cities
SET police_stations = NULL, police_stations_at = NULL
WHERE police_stations = '[]'::jsonb;

-- 3) Contrôle (doit afficher 0)
SELECT count(*) AS villes_vides_restantes
FROM us_cities
WHERE police_stations = '[]'::jsonb;
