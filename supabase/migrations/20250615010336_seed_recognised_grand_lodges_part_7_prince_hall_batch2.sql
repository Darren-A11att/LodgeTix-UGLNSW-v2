-- Seed Prince Hall Grand Lodges - Batch 2
WITH new_organisations AS (
  INSERT INTO public.organisations (name, type, country, state, abbreviation, known_as)
  VALUES 
    ('Prince Hall Grand Lodge of Minnesota', 'grandlodge', 'United States', 'Minnesota', 'PHGLMN', 'PHGLMN'),
    ('Prince Hall Grand Lodge of Nebraska', 'grandlodge', 'United States', 'Nebraska', 'PHGLNE', 'PHGLNE'),
    ('Prince Hall Grand Lodge of New Jersey', 'grandlodge', 'United States', 'New Jersey', 'PHGLNJ', 'PHGLNJ'),
    ('Prince Hall Grand Lodge of New Mexico', 'grandlodge', 'United States', 'New Mexico', 'PHGLNM', 'PHGLNM'),
    ('Prince Hall Grand Lodge of New York', 'grandlodge', 'United States', 'New York', 'PHGLNY', 'PHGLNY'),
    ('Prince Hall Grand Lodge of North Carolina', 'grandlodge', 'United States', 'North Carolina', 'PHGLNC', 'PHGLNC'),
    ('Prince Hall Grand Lodge of Ohio', 'grandlodge', 'United States', 'Ohio', 'PHGLOH', 'PHGLOH'),
    ('Prince Hall Grand Lodge of Oregon', 'grandlodge', 'United States', 'Oregon', 'PHGLOR', 'PHGLOR'),
    ('Prince Hall Grand Lodge of Pennsylvania', 'grandlodge', 'United States', 'Pennsylvania', 'PHGLPA', 'PHGLPA'),
    ('Prince Hall Grand Lodge of Rhode Island', 'grandlodge', 'United States', 'Rhode Island', 'PHGLRI', 'PHGLRI'),
    ('Prince Hall Grand Lodge of Texas', 'grandlodge', 'United States', 'Texas', 'PHGLTX', 'PHGLTX'),
    ('Prince Hall Grand Lodge of Virginia', 'grandlodge', 'United States', 'Virginia', 'PHGLVA', 'PHGLVA'),
    ('Prince Hall Grand Lodge of Washington', 'grandlodge', 'United States', 'Washington', 'PHGLWA', 'PHGLWA'),
    ('Prince Hall Grand Lodge of Wisconsin', 'grandlodge', 'United States', 'Wisconsin', 'PHGLWI', 'PHGLWI')
  RETURNING organisation_id, name
)
INSERT INTO public.grand_lodges (name, country, abbreviation, country_code_iso3, state_region, state_region_code, organisation_id)
SELECT 
  o.name,
  'United States',
  CASE o.name
    WHEN 'Prince Hall Grand Lodge of Minnesota' THEN 'PHGLMN'
    WHEN 'Prince Hall Grand Lodge of Nebraska' THEN 'PHGLNE'
    WHEN 'Prince Hall Grand Lodge of New Jersey' THEN 'PHGLNJ'
    WHEN 'Prince Hall Grand Lodge of New Mexico' THEN 'PHGLNM'
    WHEN 'Prince Hall Grand Lodge of New York' THEN 'PHGLNY'
    WHEN 'Prince Hall Grand Lodge of North Carolina' THEN 'PHGLNC'
    WHEN 'Prince Hall Grand Lodge of Ohio' THEN 'PHGLOH'
    WHEN 'Prince Hall Grand Lodge of Oregon' THEN 'PHGLOR'
    WHEN 'Prince Hall Grand Lodge of Pennsylvania' THEN 'PHGLPA'
    WHEN 'Prince Hall Grand Lodge of Rhode Island' THEN 'PHGLRI'
    WHEN 'Prince Hall Grand Lodge of Texas' THEN 'PHGLTX'
    WHEN 'Prince Hall Grand Lodge of Virginia' THEN 'PHGLVA'
    WHEN 'Prince Hall Grand Lodge of Washington' THEN 'PHGLWA'
    WHEN 'Prince Hall Grand Lodge of Wisconsin' THEN 'PHGLWI'
  END,
  'USA',
  CASE o.name
    WHEN 'Prince Hall Grand Lodge of Minnesota' THEN 'Minnesota'
    WHEN 'Prince Hall Grand Lodge of Nebraska' THEN 'Nebraska'
    WHEN 'Prince Hall Grand Lodge of New Jersey' THEN 'New Jersey'
    WHEN 'Prince Hall Grand Lodge of New Mexico' THEN 'New Mexico'
    WHEN 'Prince Hall Grand Lodge of New York' THEN 'New York'
    WHEN 'Prince Hall Grand Lodge of North Carolina' THEN 'North Carolina'
    WHEN 'Prince Hall Grand Lodge of Ohio' THEN 'Ohio'
    WHEN 'Prince Hall Grand Lodge of Oregon' THEN 'Oregon'
    WHEN 'Prince Hall Grand Lodge of Pennsylvania' THEN 'Pennsylvania'
    WHEN 'Prince Hall Grand Lodge of Rhode Island' THEN 'Rhode Island'
    WHEN 'Prince Hall Grand Lodge of Texas' THEN 'Texas'
    WHEN 'Prince Hall Grand Lodge of Virginia' THEN 'Virginia'
    WHEN 'Prince Hall Grand Lodge of Washington' THEN 'Washington'
    WHEN 'Prince Hall Grand Lodge of Wisconsin' THEN 'Wisconsin'
  END,
  CASE o.name
    WHEN 'Prince Hall Grand Lodge of Minnesota' THEN 'MN'
    WHEN 'Prince Hall Grand Lodge of Nebraska' THEN 'NE'
    WHEN 'Prince Hall Grand Lodge of New Jersey' THEN 'NJ'
    WHEN 'Prince Hall Grand Lodge of New Mexico' THEN 'NM'
    WHEN 'Prince Hall Grand Lodge of New York' THEN 'NY'
    WHEN 'Prince Hall Grand Lodge of North Carolina' THEN 'NC'
    WHEN 'Prince Hall Grand Lodge of Ohio' THEN 'OH'
    WHEN 'Prince Hall Grand Lodge of Oregon' THEN 'OR'
    WHEN 'Prince Hall Grand Lodge of Pennsylvania' THEN 'PA'
    WHEN 'Prince Hall Grand Lodge of Rhode Island' THEN 'RI'
    WHEN 'Prince Hall Grand Lodge of Texas' THEN 'TX'
    WHEN 'Prince Hall Grand Lodge of Virginia' THEN 'VA'
    WHEN 'Prince Hall Grand Lodge of Washington' THEN 'WA'
    WHEN 'Prince Hall Grand Lodge of Wisconsin' THEN 'WI'
  END,
  o.organisation_id
FROM new_organisations o;