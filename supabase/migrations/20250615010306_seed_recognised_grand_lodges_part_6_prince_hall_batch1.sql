-- Seed Prince Hall Grand Lodges - Batch 1
WITH new_organisations AS (
  INSERT INTO public.organisations (name, type, country, state, abbreviation, known_as)
  VALUES 
    ('Prince Hall Grand Lodge of Alaska', 'grandlodge', 'United States', 'Alaska', 'PHGLAK', 'PHGLAK'),
    ('Prince Hall Grand Lodge of Arizona', 'grandlodge', 'United States', 'Arizona', 'PHGLAZ', 'PHGLAZ'),
    ('Prince Hall Grand Lodge of California', 'grandlodge', 'United States', 'California', 'PHGLCA', 'PHGLCA'),
    ('Prince Hall Grand Lodge of Colorado', 'grandlodge', 'United States', 'Colorado', 'PHGLCO', 'PHGLCO'),
    ('Prince Hall Grand Lodge of Connecticut', 'grandlodge', 'United States', 'Connecticut', 'PHGLCT', 'PHGLCT'),
    ('Prince Hall Grand Lodge of the District of Columbia', 'grandlodge', 'United States', 'District of Columbia', 'PHGLDC', 'PHGLDC'),
    ('Prince Hall Grand Lodge of Hawaii', 'grandlodge', 'United States', 'Hawaii', 'PHGLHI', 'PHGLHI'),
    ('Prince Hall Grand Lodge of Illinois', 'grandlodge', 'United States', 'Illinois', 'PHGLIL', 'PHGLIL'),
    ('Prince Hall Grand Lodge of Indiana', 'grandlodge', 'United States', 'Indiana', 'PHGLIN', 'PHGLIN'),
    ('Prince Hall Grand Lodge of Iowa', 'grandlodge', 'United States', 'Iowa', 'PHGLIA', 'PHGLIA'),
    ('Prince Hall Grand Lodge of Kansas', 'grandlodge', 'United States', 'Kansas', 'PHGLKS', 'PHGLKS'),
    ('Prince Hall Grand Lodge of Maryland', 'grandlodge', 'United States', 'Maryland', 'PHGLMD', 'PHGLMD'),
    ('Prince Hall Grand Lodge of Massachusetts', 'grandlodge', 'United States', 'Massachusetts', 'PHGLMA', 'PHGLMA'),
    ('Prince Hall Grand Lodge of Michigan', 'grandlodge', 'United States', 'Michigan', 'PHGLMI', 'PHGLMI')
  RETURNING organisation_id, name
)
INSERT INTO public.grand_lodges (name, country, abbreviation, country_code_iso3, state_region, state_region_code, organisation_id)
SELECT 
  o.name,
  'United States',
  CASE o.name
    WHEN 'Prince Hall Grand Lodge of Alaska' THEN 'PHGLAK'
    WHEN 'Prince Hall Grand Lodge of Arizona' THEN 'PHGLAZ'
    WHEN 'Prince Hall Grand Lodge of California' THEN 'PHGLCA'
    WHEN 'Prince Hall Grand Lodge of Colorado' THEN 'PHGLCO'
    WHEN 'Prince Hall Grand Lodge of Connecticut' THEN 'PHGLCT'
    WHEN 'Prince Hall Grand Lodge of the District of Columbia' THEN 'PHGLDC'
    WHEN 'Prince Hall Grand Lodge of Hawaii' THEN 'PHGLHI'
    WHEN 'Prince Hall Grand Lodge of Illinois' THEN 'PHGLIL'
    WHEN 'Prince Hall Grand Lodge of Indiana' THEN 'PHGLIN'
    WHEN 'Prince Hall Grand Lodge of Iowa' THEN 'PHGLIA'
    WHEN 'Prince Hall Grand Lodge of Kansas' THEN 'PHGLKS'
    WHEN 'Prince Hall Grand Lodge of Maryland' THEN 'PHGLMD'
    WHEN 'Prince Hall Grand Lodge of Massachusetts' THEN 'PHGLMA'
    WHEN 'Prince Hall Grand Lodge of Michigan' THEN 'PHGLMI'
  END,
  'USA',
  CASE o.name
    WHEN 'Prince Hall Grand Lodge of Alaska' THEN 'Alaska'
    WHEN 'Prince Hall Grand Lodge of Arizona' THEN 'Arizona'
    WHEN 'Prince Hall Grand Lodge of California' THEN 'California'
    WHEN 'Prince Hall Grand Lodge of Colorado' THEN 'Colorado'
    WHEN 'Prince Hall Grand Lodge of Connecticut' THEN 'Connecticut'
    WHEN 'Prince Hall Grand Lodge of the District of Columbia' THEN 'District of Columbia'
    WHEN 'Prince Hall Grand Lodge of Hawaii' THEN 'Hawaii'
    WHEN 'Prince Hall Grand Lodge of Illinois' THEN 'Illinois'
    WHEN 'Prince Hall Grand Lodge of Indiana' THEN 'Indiana'
    WHEN 'Prince Hall Grand Lodge of Iowa' THEN 'Iowa'
    WHEN 'Prince Hall Grand Lodge of Kansas' THEN 'Kansas'
    WHEN 'Prince Hall Grand Lodge of Maryland' THEN 'Maryland'
    WHEN 'Prince Hall Grand Lodge of Massachusetts' THEN 'Massachusetts'
    WHEN 'Prince Hall Grand Lodge of Michigan' THEN 'Michigan'
  END,
  CASE o.name
    WHEN 'Prince Hall Grand Lodge of Alaska' THEN 'AK'
    WHEN 'Prince Hall Grand Lodge of Arizona' THEN 'AZ'
    WHEN 'Prince Hall Grand Lodge of California' THEN 'CA'
    WHEN 'Prince Hall Grand Lodge of Colorado' THEN 'CO'
    WHEN 'Prince Hall Grand Lodge of Connecticut' THEN 'CT'
    WHEN 'Prince Hall Grand Lodge of the District of Columbia' THEN 'DC'
    WHEN 'Prince Hall Grand Lodge of Hawaii' THEN 'HI'
    WHEN 'Prince Hall Grand Lodge of Illinois' THEN 'IL'
    WHEN 'Prince Hall Grand Lodge of Indiana' THEN 'IN'
    WHEN 'Prince Hall Grand Lodge of Iowa' THEN 'IA'
    WHEN 'Prince Hall Grand Lodge of Kansas' THEN 'KS'
    WHEN 'Prince Hall Grand Lodge of Maryland' THEN 'MD'
    WHEN 'Prince Hall Grand Lodge of Massachusetts' THEN 'MA'
    WHEN 'Prince Hall Grand Lodge of Michigan' THEN 'MI'
  END,
  o.organisation_id
FROM new_organisations o;