-- canada-phase2f-carte-image.sql
-- Pages villes canadiennes : cache des postes de police (villes où la police garde les objets)
-- et carte de Toronto avec les trois bureaux des objets trouvés.
-- À lancer AVANT la mise en ligne de la branche guides-ontario.

-- 1) Cache des postes de police par ville (comme us_cities)
ALTER TABLE ca_cities ADD COLUMN IF NOT EXISTS police_stations jsonb;
ALTER TABLE ca_cities ADD COLUMN IF NOT EXISTS police_stations_at timestamptz;

-- 2) Coordonnées de Toronto (hôtel de ville), seulement si elles manquent
UPDATE ca_cities
SET lat = 43.6534, lng = -79.3839
WHERE province_id = 'ON'
  AND (lower(city_ascii) = 'toronto' OR lower(city) = 'toronto')
  AND (lat IS NULL OR lng IS NULL);

-- 3) Carte du guide de Toronto : les bureaux qui gardent réellement les objets
UPDATE ca_city_guides
SET guide = guide || jsonb_build_object(
      'map', jsonb_build_object(
        'mode', 'places',
        'heading', 'Where lost items are held in Toronto',
        'note', 'Each office keeps the items found on its own network. Opening hours and how to claim are in the cards below.',
        'places', jsonb_build_array(
          jsonb_build_object('name', 'TTC Lost Articles Office', 'address', 'Bay subway station', 'lat', 43.6702, 'lng', -79.3900),
          jsonb_build_object('name', 'GO Transit Lost and Found', 'address', 'Counter 6, York Concourse, Union Station, 35 York Street', 'lat', 43.6451, 'lng', -79.3815),
          jsonb_build_object('name', 'Toronto Pearson Lost and Found Office', 'address', 'Terminal 1, before security, between doors R and S', 'lat', 43.6809, 'lng', -79.6113)
        )
      )
    ),
    updated_at = now()
WHERE province_id = 'ON' AND city_ascii = 'toronto' AND lang = 'en';

-- 4) Contrôle
SELECT c.id, c.city, c.city_ascii, c.lat, c.lng, c.image_url,
       g.guide -> 'map' ->> 'mode' AS map_mode,
       jsonb_array_length(g.guide -> 'map' -> 'places') AS nb_lieux
FROM ca_cities c
JOIN ca_city_guides g
  ON g.province_id = c.province_id AND g.city_ascii = 'toronto' AND g.lang = 'en'
WHERE c.province_id = 'ON'
  AND (lower(c.city_ascii) = 'toronto' OR lower(c.city) = 'toronto');
