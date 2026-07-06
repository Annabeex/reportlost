-- ============================================================
-- Houston row (Supabase table: us_cities)
-- SEO metadata → <title> + meta description.
-- (Photo: npx tsx scripts/regen-city-image.ts "Houston" TX)
-- ============================================================

UPDATE us_cities
SET
  static_title   = 'Houston Lost & Found: Report & Recover a Lost Item',
  static_content = 'Lost something in Houston? Report it in minutes and we route it to the right HPD property channel, METRO, airport and rideshare lost & found, plus local groups.'
WHERE state_id = 'TX'
  AND city_ascii ILIKE 'Houston';

-- Check:
-- SELECT city_ascii, state_id, static_title, LEFT(static_content,160) AS meta, image_url
-- FROM us_cities WHERE state_id = 'TX' AND city_ascii ILIKE 'Houston';
