INSERT INTO "public"."locations" ("location_id", "room_or_area", "place_name", "street_address", "suburb", "state", "postal_code", "country", "latitude", "longitude", "capacity", "created_at", "updated_at", "phone", "email", "website", "description", "parking_info", "public_transport_info", "accessibility_info", "image_urls", "google_maps_embed_url", "google_maps_place_id", "operating_hours", "venue_features", "dress_code") 
VALUES 
  ('18542763-954b-44ce-845b-5a80fd1c4fc9', '', 'Sydney Masonic Centre', '66 Goulburn Street', 'Sydney', 'NSW', '2000', 'Australia', null, null, null, '2025-05-29 12:05:11.87594+00', '2025-05-29 13:38:11.650657+00', null, null, null, null, null, null, null, '[]', null, null, '{}', null, null), 
  ('90221696-ce68-432d-b2a5-d35451299c55', null, 'Sydney Harbour', null, null, null, null, null, null, null, null, '2025-04-26 02:44:11.182692+00', '2025-05-29 13:38:11.650657+00', null, null, null, null, null, null, null, '[]', null, null, '{}', null, null)
ON CONFLICT (location_id) 
DO UPDATE SET 
  room_or_area = EXCLUDED.room_or_area,
  place_name = EXCLUDED.place_name,
  street_address = EXCLUDED.street_address,
  suburb = EXCLUDED.suburb,
  state = EXCLUDED.state,
  postal_code = EXCLUDED.postal_code,
  country = EXCLUDED.country,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  capacity = EXCLUDED.capacity,
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  website = EXCLUDED.website,
  description = EXCLUDED.description,
  parking_info = EXCLUDED.parking_info,
  public_transport_info = EXCLUDED.public_transport_info,
  accessibility_info = EXCLUDED.accessibility_info,
  image_urls = EXCLUDED.image_urls,
  google_maps_embed_url = EXCLUDED.google_maps_embed_url,
  google_maps_place_id = EXCLUDED.google_maps_place_id,
  operating_hours = EXCLUDED.operating_hours,
  venue_features = EXCLUDED.venue_features,
  dress_code = EXCLUDED.dress_code;