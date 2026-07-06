-- ============================================================
-- New York City row (Supabase table: us_cities)
-- 1) SEO metadata  → <title> + meta description
-- 2) City photo    → fixes the empty / coloured placeholder
-- Run in the Supabase SQL editor.
-- ============================================================

-- 1) SEO ------------------------------------------------------
UPDATE us_cities
SET
  static_title   = 'Lost & Found in New York City: Report a Lost Item',
  static_content = 'Lost something in New York City? Report it in minutes and we route it to the right NYPD precinct, MTA, taxi and airport lost & found, plus local channels.'
WHERE state_id = 'NY'
  AND city_ascii ILIKE 'New York';

-- 2) PHOTO ----------------------------------------------------
-- The orange/empty square = image_url is missing or stale.
--
-- OPTION A (recommended): reset it to NULL so your existing Pexels
-- pipeline (fetchCityImageDirectly) refetches automatically the next
-- time you open the page in `npm run dev` (needs PEXELS_API_KEY set).
UPDATE us_cities
SET image_url = NULL, image_alt = NULL, photographer = NULL, image_source_url = NULL
WHERE state_id = 'NY' AND city_ascii ILIKE 'New York';

-- OPTION B: if you have no PEXELS_API_KEY locally, set a fixed photo
-- directly (swap the URL for any image you prefer from pexels.com):
-- UPDATE us_cities
-- SET image_url = 'https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg?auto=compress&cs=tinysrgb&h=350',
--     image_alt = 'View of New York City',
--     photographer = 'Pexels'
-- WHERE state_id = 'NY' AND city_ascii ILIKE 'New York';

-- Check:
-- SELECT city_ascii, state_id, static_title, LEFT(static_content,160) AS meta, image_url
-- FROM us_cities WHERE state_id = 'NY' AND city_ascii ILIKE 'New York';
