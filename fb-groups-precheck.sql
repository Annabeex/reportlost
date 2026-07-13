-- Pré-cochage des villes dont le groupe Facebook existe déjà
-- (extraites des captures d'écran des groupes existants).
-- À exécuter une fois dans le SQL editor de Supabase.

UPDATE us_cities SET fb_group_done = true
WHERE (upper(state_id), lower(city_ascii)) IN (
  ('WI','brookfield'), ('TX','canyon lake'), ('CO','thornton'),
  ('NC','beech mountain'), ('MD','laurel'), ('CA','bell'),
  ('AR','sherwood'), ('UT','kaysville'), ('CA','grass valley'),
  ('MI','detroit'), ('IL','chicago'), ('CA','riverside'),
  ('NV','las vegas'), ('CA','blythe'), ('NJ','brigantine'),
  ('FL','everglades'), ('FL','everglades city'),
  ('PA','philadelphia'), ('OK','edmond'), ('MI','plymouth'),
  ('AZ','sierra vista'), ('CA','carmel-by-the-sea'), ('CA','carmel by the sea'),
  ('FL','anna maria'), ('TX','el paso'), ('CT','danbury'),
  ('UT','clearfield'), ('NJ','secaucus'), ('TX','houston'),
  ('PA','latrobe'), ('FL','tampa'), ('TX','hillsboro'),
  ('MI','belleville'), ('MO','webster groves'), ('NH','rochester'),
  ('MD','baltimore'), ('IL','rosemont'), ('MN','minneapolis'),
  ('CA','pasadena'), ('TX','olmos park'), ('NY','queens'),
  ('NC','charlotte'), ('CA','santa barbara'), ('NC','gastonia'),
  ('NC','raleigh'), ('OR','portland'), ('MA','boston'),
  ('CA','san francisco'), ('PA','brookhaven'), ('VA','virginia beach'),
  ('MI','okemos'), ('AZ','phoenix'), ('AZ','quartzsite'),
  ('CA','san diego'), ('FL','miami'), ('MN','plymouth'),
  ('NJ','springfield'), ('FL','hallandale beach'), ('FL','hallandale'),
  ('TN','memphis'), ('WA','seattle'), ('NY','brooklyn'),
  ('TX','dallas'), ('CA','los angeles'), ('NH','nashua'),
  ('IL','glendale heights'), ('CO','denver'), ('IN','plymouth'),
  ('PR','culebra'), ('MO','st. louis'), ('MO','saint louis'),
  ('CA','mammoth lakes'), ('GA','atlanta'), ('CA','santa ynez'),
  ('SC','conway'), ('CA','dana point'), ('NJ','belmar'),
  ('DC','washington'), ('NY','new york'), ('MO','kansas city'),
  ('PA','pittsburgh'), ('IN','indianapolis'), ('NY','bronx'),
  ('OH','cincinnati'), ('OH','cleveland'), ('OH','columbus')
);

-- Vérification : liste des villes cochées
SELECT state_id, city_ascii, population
FROM us_cities
WHERE fb_group_done = true
ORDER BY state_id, city_ascii;
