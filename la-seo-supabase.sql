-- ============================================================
-- Los Angeles row (Supabase table: us_cities)
-- SEO metadata → <title> + meta description.
-- Run in the Supabase SQL editor.
-- (For the photo, run: npx tsx scripts/regen-city-image.ts "Los Angeles" CA)
-- ============================================================

UPDATE us_cities
SET
  static_title   = 'Lost & Found in Los Angeles: Report a Lost Item',
  static_content = 'Lost something in Los Angeles? Report it in minutes and we route it to the right LAPD area, Metro, LAX and rideshare lost & found, plus local channels.'
WHERE state_id = 'CA'
  AND city_ascii ILIKE 'Los Angeles';

-- Check:
-- SELECT city_ascii, state_id, static_title, LEFT(static_content,160) AS meta, image_url
-- FROM us_cities WHERE state_id = 'CA' AND city_ascii ILIKE 'Los Angeles';
