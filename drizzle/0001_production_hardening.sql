DELETE FROM reviews a USING reviews b
WHERE a.id > b.id
  AND a.listing_id = b.listing_id
  AND a.user_id = b.user_id;

DELETE FROM listings WHERE sample = true;

CREATE TABLE IF NOT EXISTS rate_limits (
  key text PRIMARY KEY,
  window_start timestamp NOT NULL,
  count integer NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS review_user_listing_unique
  ON reviews (user_id, listing_id);
