-- ============================================================
-- Phoenix row (Supabase table: us_cities)
-- SEO metadata → <title> + meta description.
-- (Photo: npx tsx scripts/regen-city-image.ts "Phoenix" AZ)
-- ============================================================

UPDATE us_cities
SET
  static_title   = 'Phoenix Lost & Found: How to Report a Lost Item',
  static_content = 'Lost something in Phoenix? Report it in minutes and we point you to the right Phoenix Police property bureau, Valley Metro, Sky Harbor and rideshare lost & found.'
WHERE state_id = 'AZ'
  AND city_ascii ILIKE 'Phoenix';

-- Check:
-- SELECT city_ascii, state_id, static_title, LEFT(static_content,160) AS meta, image_url
-- FROM us_cities WHERE state_id = 'AZ' AND city_ascii ILIKE 'Phoenix';
