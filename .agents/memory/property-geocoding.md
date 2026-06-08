---
name: Property geocoding
description: How property map coordinates are auto-derived from addresses on create/update
---

# Property geocoding

Property `latitude`/`longitude` are auto-derived from the address via the free
OpenStreetMap **Nominatim** API (no API key) in the api-server geocode helper,
wired into property create + update routes. OSM-family geocoding was chosen to
stay consistent with the map tiles (OSM/CartoDB).

**Why Nominatim:** zero cost / no key, and the map already renders OSM tiles.

**How to apply / constraints:**
- Geocoding is **best-effort** — failures log a warning and never block the
  property save (coords stay null; the map filters out coordless properties).
- Treat coords as "explicitly provided" only when BOTH lat+lon are finite
  numbers (`hasValidCoords`); otherwise geocode and write both together.
- Nominatim acceptable-use is ~1 req/sec: the helper serializes requests through
  a promise chain with a min interval and caches results per-process by address.
  Honor this — do not fan out parallel Nominatim calls.
- Update route verifies the property exists before spending a geocode request.
- Tries structured query (street+postcode+city) → free-form → postcode+city
  coarse fallback, so it almost always returns an approximate location.
