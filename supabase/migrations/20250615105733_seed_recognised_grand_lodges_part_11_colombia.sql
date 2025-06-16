-- Seed Colombian Grand Lodges
WITH new_organisations AS (
  INSERT INTO public.organisations (name, type, country, city, abbreviation, known_as)
  VALUES 
    ('Grand Lodge of Colombia at Barranquilla', 'grandlodge', 'Colombia', 'Barranquilla', 'GLCB', 'GLCB'),
    ('Grand Lodge of Colombia at Bogota', 'grandlodge', 'Colombia', 'Bogota', 'GLCBO', 'GLCBO'),
    ('Grand Lodge of Colombia at Cartagena', 'grandlodge', 'Colombia', 'Cartagena', 'GLCC', 'GLCC'),
    ('Grand Lodge of Los Andes', 'grandlodge', 'Colombia', NULL, 'GLLA', 'GLLA')
  RETURNING organisation_id, name
)
INSERT INTO public.grand_lodges (name, country, abbreviation, country_code_iso3, organisation_id)
SELECT 
  o.name,
  'Colombia',
  CASE o.name
    WHEN 'Grand Lodge of Colombia at Barranquilla' THEN 'GLCB'
    WHEN 'Grand Lodge of Colombia at Bogota' THEN 'GLCBO'
    WHEN 'Grand Lodge of Colombia at Cartagena' THEN 'GLCC'
    WHEN 'Grand Lodge of Los Andes' THEN 'GLLA'
  END,
  'COL',
  o.organisation_id
FROM new_organisations o;