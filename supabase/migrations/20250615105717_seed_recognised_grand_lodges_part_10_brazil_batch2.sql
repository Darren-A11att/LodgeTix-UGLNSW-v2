-- Seed Brazilian Grand Lodges - Batch 2
WITH new_organisations AS (
  INSERT INTO public.organisations (name, type, country, state, abbreviation, known_as)
  VALUES 
    ('Grand Lodge of the State of Piauí', 'grandlodge', 'Brazil', 'Piauí', 'GLPI', 'GLPI'),
    ('Independent Grand Orient of Pernambuco', 'grandlodge', 'Brazil', 'Pernambuco', 'IGOPE', 'IGOPE'),
    ('Grand Lodge of the State of Rio De Janeiro', 'grandlodge', 'Brazil', 'Rio de Janeiro', 'GLRJ', 'GLRJ'),
    ('Grand Orient of Rio Grande do Norte', 'grandlodge', 'Brazil', 'Rio Grande do Norte', 'GORN', 'GORN'),
    ('Grand Lodge of the State of Rio Grande do Sul', 'grandlodge', 'Brazil', 'Rio Grande do Sul', 'GLRS', 'GLRS'),
    ('Grand Lodge of the State of São Paulo', 'grandlodge', 'Brazil', 'São Paulo', 'GLSP', 'GLSP'),
    ('Grand Orient Paulista', 'grandlodge', 'Brazil', 'São Paulo', 'GOP', 'GOP'),
    ('Grand Orient of Santa Catarina', 'grandlodge', 'Brazil', 'Santa Catarina', 'GOSC', 'GOSC')
  RETURNING organisation_id, name
)
INSERT INTO public.grand_lodges (name, country, abbreviation, country_code_iso3, state_region, state_region_code, organisation_id)
SELECT 
  o.name,
  'Brazil',
  CASE o.name
    WHEN 'Grand Lodge of the State of Piauí' THEN 'GLPI'
    WHEN 'Independent Grand Orient of Pernambuco' THEN 'IGOPE'
    WHEN 'Grand Lodge of the State of Rio De Janeiro' THEN 'GLRJ'
    WHEN 'Grand Orient of Rio Grande do Norte' THEN 'GORN'
    WHEN 'Grand Lodge of the State of Rio Grande do Sul' THEN 'GLRS'
    WHEN 'Grand Lodge of the State of São Paulo' THEN 'GLSP'
    WHEN 'Grand Orient Paulista' THEN 'GOP'
    WHEN 'Grand Orient of Santa Catarina' THEN 'GOSC'
  END,
  'BRA',
  CASE o.name
    WHEN 'Grand Lodge of the State of Piauí' THEN 'Piauí'
    WHEN 'Independent Grand Orient of Pernambuco' THEN 'Pernambuco'
    WHEN 'Grand Lodge of the State of Rio De Janeiro' THEN 'Rio de Janeiro'
    WHEN 'Grand Orient of Rio Grande do Norte' THEN 'Rio Grande do Norte'
    WHEN 'Grand Lodge of the State of Rio Grande do Sul' THEN 'Rio Grande do Sul'
    WHEN 'Grand Lodge of the State of São Paulo' THEN 'São Paulo'
    WHEN 'Grand Orient Paulista' THEN 'São Paulo'
    WHEN 'Grand Orient of Santa Catarina' THEN 'Santa Catarina'
  END,
  CASE o.name
    WHEN 'Grand Lodge of the State of Piauí' THEN 'PI'
    WHEN 'Independent Grand Orient of Pernambuco' THEN 'PE'
    WHEN 'Grand Lodge of the State of Rio De Janeiro' THEN 'RJ'
    WHEN 'Grand Orient of Rio Grande do Norte' THEN 'RN'
    WHEN 'Grand Lodge of the State of Rio Grande do Sul' THEN 'RS'
    WHEN 'Grand Lodge of the State of São Paulo' THEN 'SP'
    WHEN 'Grand Orient Paulista' THEN 'SP'
    WHEN 'Grand Orient of Santa Catarina' THEN 'SC'
  END,
  o.organisation_id
FROM new_organisations o;