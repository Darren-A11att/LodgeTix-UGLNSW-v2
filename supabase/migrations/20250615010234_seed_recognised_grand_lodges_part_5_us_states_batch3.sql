-- Seed US State Grand Lodges - Batch 3 (North Carolina - Wyoming + DC)
WITH new_organisations AS (
  INSERT INTO public.organisations (name, type, country, state, abbreviation, known_as)
  VALUES 
    ('Grand Lodge of North Carolina', 'grandlodge', 'United States', 'North Carolina', 'GLNC', 'GLNC'),
    ('Grand Lodge of North Dakota', 'grandlodge', 'United States', 'North Dakota', 'GLND', 'GLND'),
    ('Grand Lodge of Ohio', 'grandlodge', 'United States', 'Ohio', 'GLOH', 'GLOH'),
    ('Grand Lodge of Oklahoma', 'grandlodge', 'United States', 'Oklahoma', 'GLOK', 'GLOK'),
    ('Grand Lodge of Oregon', 'grandlodge', 'United States', 'Oregon', 'GLOR', 'GLOR'),
    ('Grand Lodge of Rhode Island', 'grandlodge', 'United States', 'Rhode Island', 'GLRI', 'GLRI'),
    ('Grand Lodge of South Carolina', 'grandlodge', 'United States', 'South Carolina', 'GLSC', 'GLSC'),
    ('Grand Lodge of South Dakota', 'grandlodge', 'United States', 'South Dakota', 'GLSD', 'GLSD'),
    ('Grand Lodge of Tennessee', 'grandlodge', 'United States', 'Tennessee', 'GLTN', 'GLTN'),
    ('Grand Lodge of the District of Columbia', 'grandlodge', 'United States', 'District of Columbia', 'GLDC', 'GLDC'),
    ('Grand Lodge of Utah', 'grandlodge', 'United States', 'Utah', 'GLUT', 'GLUT'),
    ('Grand Lodge of Vermont', 'grandlodge', 'United States', 'Vermont', 'GLVT', 'GLVT'),
    ('Grand Lodge of Virginia', 'grandlodge', 'United States', 'Virginia', 'GLVA', 'GLVA'),
    ('Grand Lodge of Washington', 'grandlodge', 'United States', 'Washington', 'GLWA', 'GLWA'),
    ('Grand Lodge of West Virginia', 'grandlodge', 'United States', 'West Virginia', 'GLWV', 'GLWV'),
    ('Grand Lodge of Wisconsin', 'grandlodge', 'United States', 'Wisconsin', 'GLWI', 'GLWI'),
    ('Grand Lodge of Wyoming', 'grandlodge', 'United States', 'Wyoming', 'GLWY', 'GLWY')
  RETURNING organisation_id, name
)
INSERT INTO public.grand_lodges (name, country, abbreviation, country_code_iso3, state_region, state_region_code, organisation_id)
SELECT 
  o.name,
  'United States',
  CASE o.name
    WHEN 'Grand Lodge of North Carolina' THEN 'GLNC'
    WHEN 'Grand Lodge of North Dakota' THEN 'GLND'
    WHEN 'Grand Lodge of Ohio' THEN 'GLOH'
    WHEN 'Grand Lodge of Oklahoma' THEN 'GLOK'
    WHEN 'Grand Lodge of Oregon' THEN 'GLOR'
    WHEN 'Grand Lodge of Rhode Island' THEN 'GLRI'
    WHEN 'Grand Lodge of South Carolina' THEN 'GLSC'
    WHEN 'Grand Lodge of South Dakota' THEN 'GLSD'
    WHEN 'Grand Lodge of Tennessee' THEN 'GLTN'
    WHEN 'Grand Lodge of the District of Columbia' THEN 'GLDC'
    WHEN 'Grand Lodge of Utah' THEN 'GLUT'
    WHEN 'Grand Lodge of Vermont' THEN 'GLVT'
    WHEN 'Grand Lodge of Virginia' THEN 'GLVA'
    WHEN 'Grand Lodge of Washington' THEN 'GLWA'
    WHEN 'Grand Lodge of West Virginia' THEN 'GLWV'
    WHEN 'Grand Lodge of Wisconsin' THEN 'GLWI'
    WHEN 'Grand Lodge of Wyoming' THEN 'GLWY'
  END,
  'USA',
  CASE o.name
    WHEN 'Grand Lodge of North Carolina' THEN 'North Carolina'
    WHEN 'Grand Lodge of North Dakota' THEN 'North Dakota'
    WHEN 'Grand Lodge of Ohio' THEN 'Ohio'
    WHEN 'Grand Lodge of Oklahoma' THEN 'Oklahoma'
    WHEN 'Grand Lodge of Oregon' THEN 'Oregon'
    WHEN 'Grand Lodge of Rhode Island' THEN 'Rhode Island'
    WHEN 'Grand Lodge of South Carolina' THEN 'South Carolina'
    WHEN 'Grand Lodge of South Dakota' THEN 'South Dakota'
    WHEN 'Grand Lodge of Tennessee' THEN 'Tennessee'
    WHEN 'Grand Lodge of the District of Columbia' THEN 'District of Columbia'
    WHEN 'Grand Lodge of Utah' THEN 'Utah'
    WHEN 'Grand Lodge of Vermont' THEN 'Vermont'
    WHEN 'Grand Lodge of Virginia' THEN 'Virginia'
    WHEN 'Grand Lodge of Washington' THEN 'Washington'
    WHEN 'Grand Lodge of West Virginia' THEN 'West Virginia'
    WHEN 'Grand Lodge of Wisconsin' THEN 'Wisconsin'
    WHEN 'Grand Lodge of Wyoming' THEN 'Wyoming'
  END,
  CASE o.name
    WHEN 'Grand Lodge of North Carolina' THEN 'NC'
    WHEN 'Grand Lodge of North Dakota' THEN 'ND'
    WHEN 'Grand Lodge of Ohio' THEN 'OH'
    WHEN 'Grand Lodge of Oklahoma' THEN 'OK'
    WHEN 'Grand Lodge of Oregon' THEN 'OR'
    WHEN 'Grand Lodge of Rhode Island' THEN 'RI'
    WHEN 'Grand Lodge of South Carolina' THEN 'SC'
    WHEN 'Grand Lodge of South Dakota' THEN 'SD'
    WHEN 'Grand Lodge of Tennessee' THEN 'TN'
    WHEN 'Grand Lodge of the District of Columbia' THEN 'DC'
    WHEN 'Grand Lodge of Utah' THEN 'UT'
    WHEN 'Grand Lodge of Vermont' THEN 'VT'
    WHEN 'Grand Lodge of Virginia' THEN 'VA'
    WHEN 'Grand Lodge of Washington' THEN 'WA'
    WHEN 'Grand Lodge of West Virginia' THEN 'WV'
    WHEN 'Grand Lodge of Wisconsin' THEN 'WI'
    WHEN 'Grand Lodge of Wyoming' THEN 'WY'
  END,
  o.organisation_id
FROM new_organisations o;