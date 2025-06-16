-- Seed US State Grand Lodges - Batch 1 (Alabama - Kansas)
WITH new_organisations AS (
  INSERT INTO public.organisations (name, type, country, state, abbreviation, known_as)
  VALUES 
    ('Grand Lodge of Alabama', 'grandlodge', 'United States', 'Alabama', 'GLAL', 'GLAL'),
    ('Grand Lodge of Alaska', 'grandlodge', 'United States', 'Alaska', 'GLAK', 'GLAK'),
    ('Grand Lodge of Arizona', 'grandlodge', 'United States', 'Arizona', 'GLAZ', 'GLAZ'),
    ('Grand Lodge of Arkansas', 'grandlodge', 'United States', 'Arkansas', 'GLAR', 'GLAR'),
    ('Grand Lodge of Colorado', 'grandlodge', 'United States', 'Colorado', 'GLCO', 'GLCO'),
    ('Grand Lodge of Connecticut', 'grandlodge', 'United States', 'Connecticut', 'GLCT', 'GLCT'),
    ('Grand Lodge of Delaware', 'grandlodge', 'United States', 'Delaware', 'GLDE', 'GLDE'),
    ('Grand Lodge of Florida', 'grandlodge', 'United States', 'Florida', 'GLFL', 'GLFL'),
    ('Grand Lodge of Georgia', 'grandlodge', 'United States', 'Georgia', 'GLGA', 'GLGA'),
    ('Grand Lodge of Hawaii', 'grandlodge', 'United States', 'Hawaii', 'GLHI', 'GLHI'),
    ('Grand Lodge of Idaho', 'grandlodge', 'United States', 'Idaho', 'GLID', 'GLID'),
    ('Grand Lodge of Indiana', 'grandlodge', 'United States', 'Indiana', 'GLIN', 'GLIN'),
    ('Grand Lodge of Iowa', 'grandlodge', 'United States', 'Iowa', 'GLIA', 'GLIA'),
    ('Grand Lodge of Kansas', 'grandlodge', 'United States', 'Kansas', 'GLKS', 'GLKS')
  RETURNING organisation_id, name
)
INSERT INTO public.grand_lodges (name, country, abbreviation, country_code_iso3, state_region, state_region_code, organisation_id)
SELECT 
  o.name,
  'United States',
  CASE o.name
    WHEN 'Grand Lodge of Alabama' THEN 'GLAL'
    WHEN 'Grand Lodge of Alaska' THEN 'GLAK'
    WHEN 'Grand Lodge of Arizona' THEN 'GLAZ'
    WHEN 'Grand Lodge of Arkansas' THEN 'GLAR'
    WHEN 'Grand Lodge of Colorado' THEN 'GLCO'
    WHEN 'Grand Lodge of Connecticut' THEN 'GLCT'
    WHEN 'Grand Lodge of Delaware' THEN 'GLDE'
    WHEN 'Grand Lodge of Florida' THEN 'GLFL'
    WHEN 'Grand Lodge of Georgia' THEN 'GLGA'
    WHEN 'Grand Lodge of Hawaii' THEN 'GLHI'
    WHEN 'Grand Lodge of Idaho' THEN 'GLID'
    WHEN 'Grand Lodge of Indiana' THEN 'GLIN'
    WHEN 'Grand Lodge of Iowa' THEN 'GLIA'
    WHEN 'Grand Lodge of Kansas' THEN 'GLKS'
  END,
  'USA',
  CASE o.name
    WHEN 'Grand Lodge of Alabama' THEN 'Alabama'
    WHEN 'Grand Lodge of Alaska' THEN 'Alaska'
    WHEN 'Grand Lodge of Arizona' THEN 'Arizona'
    WHEN 'Grand Lodge of Arkansas' THEN 'Arkansas'
    WHEN 'Grand Lodge of Colorado' THEN 'Colorado'
    WHEN 'Grand Lodge of Connecticut' THEN 'Connecticut'
    WHEN 'Grand Lodge of Delaware' THEN 'Delaware'
    WHEN 'Grand Lodge of Florida' THEN 'Florida'
    WHEN 'Grand Lodge of Georgia' THEN 'Georgia'
    WHEN 'Grand Lodge of Hawaii' THEN 'Hawaii'
    WHEN 'Grand Lodge of Idaho' THEN 'Idaho'
    WHEN 'Grand Lodge of Indiana' THEN 'Indiana'
    WHEN 'Grand Lodge of Iowa' THEN 'Iowa'
    WHEN 'Grand Lodge of Kansas' THEN 'Kansas'
  END,
  CASE o.name
    WHEN 'Grand Lodge of Alabama' THEN 'AL'
    WHEN 'Grand Lodge of Alaska' THEN 'AK'
    WHEN 'Grand Lodge of Arizona' THEN 'AZ'
    WHEN 'Grand Lodge of Arkansas' THEN 'AR'
    WHEN 'Grand Lodge of Colorado' THEN 'CO'
    WHEN 'Grand Lodge of Connecticut' THEN 'CT'
    WHEN 'Grand Lodge of Delaware' THEN 'DE'
    WHEN 'Grand Lodge of Florida' THEN 'FL'
    WHEN 'Grand Lodge of Georgia' THEN 'GA'
    WHEN 'Grand Lodge of Hawaii' THEN 'HI'
    WHEN 'Grand Lodge of Idaho' THEN 'ID'
    WHEN 'Grand Lodge of Indiana' THEN 'IN'
    WHEN 'Grand Lodge of Iowa' THEN 'IA'
    WHEN 'Grand Lodge of Kansas' THEN 'KS'
  END,
  o.organisation_id
FROM new_organisations o;