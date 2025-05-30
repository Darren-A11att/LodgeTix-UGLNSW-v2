-- Update location data with proper address information
-- This fixes the TBD location issue

UPDATE locations 
SET 
  street_address = '66 Goulburn Street',
  suburb = 'Sydney',
  state = 'NSW',
  postal_code = '2000',
  country = 'Australia'
WHERE place_name = 'Sydney Masonic Centre'
  AND suburb IS NULL;