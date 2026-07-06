-- ============================================================
-- SEO metadata for the New York City page (Supabase: us_cities)
-- Drives the <title> (static_title) and meta description
-- (static_content, sliced to 160 chars) in generateMetadata.ts.
-- Run this in the Supabase SQL editor.
-- ============================================================

UPDATE us_cities
SET
  static_title   = 'Lost & Found in New York City: Report a Lost Item',
  static_content = 'Lost something in New York City? Report it in minutes and we route it to the right NYPD precinct, MTA, taxi and airport lost & found, plus local channels.'
WHERE state_id = 'NY'
  AND city_ascii ILIKE 'New York';

-- Optional check:
-- SELECT city_ascii, state_id, static_title, LEFT(static_content, 160) AS meta_description
-- FROM us_cities WHERE state_id = 'NY' AND city_ascii ILIKE 'New York';
