-- ============================================================
-- Chicago row (Supabase table: us_cities)
-- SEO metadata → <title> + meta description.
-- (Photo: npx tsx scripts/regen-city-image.ts "Chicago" IL)
-- ============================================================

UPDATE us_cities
SET
  static_title   = 'Chicago Lost & Found: How to Report a Lost Item',
  static_content = 'Left something behind in Chicago? Report it in minutes and we point you to the right Chicago Police district, CTA, airport and rideshare lost & found, and local groups.'
WHERE state_id = 'IL'
  AND city_ascii ILIKE 'Chicago';

-- Check:
-- SELECT city_ascii, state_id, static_title, LEFT(static_content,160) AS meta, image_url
-- FROM us_cities WHERE state_id = 'IL' AND city_ascii ILIKE 'Chicago';
