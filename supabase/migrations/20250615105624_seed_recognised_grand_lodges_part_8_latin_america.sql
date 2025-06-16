-- Seed Latin American Grand Lodges
WITH new_organisations AS (
  INSERT INTO public.organisations (name, type, country, state, abbreviation, known_as)
  VALUES 
    ('Grand Lodge of Costa Rica', 'grandlodge', 'Costa Rica', NULL, 'GLCR', 'GLCR'),
    ('Grand Lodge of Cuba', 'grandlodge', 'Cuba', NULL, 'GLC', 'GLC'),
    ('Grand Lodge of Puerto Rico', 'grandlodge', 'Puerto Rico', NULL, 'GLPR', 'GLPR'),
    ('Prince Hall Grand Lodge of the Commonwealth of the Bahamas', 'grandlodge', 'Bahamas', NULL, 'PHGLB', 'PHGLB'),
    ('Prince Hall Grand Lodge of the Caribbean and Jurisdiction', 'grandlodge', 'Caribbean', NULL, 'PHGLC', 'PHGLC'),
    ('Grand Lodge of the State of Baja California', 'grandlodge', 'Mexico', 'Baja California', 'GLBC', 'GLBC'),
    ('Grand Lodge Benemérito Ejército de Oriente of the State of Puebla', 'grandlodge', 'Mexico', 'Puebla', 'GLBEOP', 'GLBEOP'),
    ('York Grand Lodge of Mexico', 'grandlodge', 'Mexico', NULL, 'YGLM', 'YGLM'),
    ('Grand Lodge of Argentina', 'grandlodge', 'Argentina', NULL, 'GLA', 'GLA'),
    ('Grand Lodge of Chile', 'grandlodge', 'Chile', NULL, 'GLC', 'GLC'),
    ('Grand Lodge of Ecuador', 'grandlodge', 'Ecuador', NULL, 'GLE', 'GLE'),
    ('Symbolic Grand Lodge of Paraguay', 'grandlodge', 'Paraguay', NULL, 'SGLP', 'SGLP'),
    ('Grand Lodge of Peru', 'grandlodge', 'Peru', NULL, 'GLP', 'GLP'),
    ('Grand Lodge of Uruguay', 'grandlodge', 'Uruguay', NULL, 'GLU', 'GLU'),
    ('Grand Lodge of the Republic of Venezuela', 'grandlodge', 'Venezuela', NULL, 'GLRV', 'GLRV')
  RETURNING organisation_id, name
)
INSERT INTO public.grand_lodges (name, country, abbreviation, country_code_iso3, state_region, state_region_code, organisation_id)
SELECT 
  o.name,
  CASE o.name
    WHEN 'Grand Lodge of Costa Rica' THEN 'Costa Rica'
    WHEN 'Grand Lodge of Cuba' THEN 'Cuba'
    WHEN 'Grand Lodge of Puerto Rico' THEN 'Puerto Rico'
    WHEN 'Prince Hall Grand Lodge of the Commonwealth of the Bahamas' THEN 'Bahamas'
    WHEN 'Prince Hall Grand Lodge of the Caribbean and Jurisdiction' THEN 'Caribbean'
    WHEN 'Grand Lodge of the State of Baja California' THEN 'Mexico'
    WHEN 'Grand Lodge Benemérito Ejército de Oriente of the State of Puebla' THEN 'Mexico'
    WHEN 'York Grand Lodge of Mexico' THEN 'Mexico'
    WHEN 'Grand Lodge of Argentina' THEN 'Argentina'
    WHEN 'Grand Lodge of Chile' THEN 'Chile'
    WHEN 'Grand Lodge of Ecuador' THEN 'Ecuador'
    WHEN 'Symbolic Grand Lodge of Paraguay' THEN 'Paraguay'
    WHEN 'Grand Lodge of Peru' THEN 'Peru'
    WHEN 'Grand Lodge of Uruguay' THEN 'Uruguay'
    WHEN 'Grand Lodge of the Republic of Venezuela' THEN 'Venezuela'
  END,
  CASE o.name
    WHEN 'Grand Lodge of Costa Rica' THEN 'GLCR'
    WHEN 'Grand Lodge of Cuba' THEN 'GLC'
    WHEN 'Grand Lodge of Puerto Rico' THEN 'GLPR'
    WHEN 'Prince Hall Grand Lodge of the Commonwealth of the Bahamas' THEN 'PHGLB'
    WHEN 'Prince Hall Grand Lodge of the Caribbean and Jurisdiction' THEN 'PHGLC'
    WHEN 'Grand Lodge of the State of Baja California' THEN 'GLBC'
    WHEN 'Grand Lodge Benemérito Ejército de Oriente of the State of Puebla' THEN 'GLBEOP'
    WHEN 'York Grand Lodge of Mexico' THEN 'YGLM'
    WHEN 'Grand Lodge of Argentina' THEN 'GLA'
    WHEN 'Grand Lodge of Chile' THEN 'GLC'
    WHEN 'Grand Lodge of Ecuador' THEN 'GLE'
    WHEN 'Symbolic Grand Lodge of Paraguay' THEN 'SGLP'
    WHEN 'Grand Lodge of Peru' THEN 'GLP'
    WHEN 'Grand Lodge of Uruguay' THEN 'GLU'
    WHEN 'Grand Lodge of the Republic of Venezuela' THEN 'GLRV'
  END,
  CASE o.name
    WHEN 'Grand Lodge of Costa Rica' THEN 'CRI'
    WHEN 'Grand Lodge of Cuba' THEN 'CUB'
    WHEN 'Grand Lodge of Puerto Rico' THEN 'PRI'
    WHEN 'Prince Hall Grand Lodge of the Commonwealth of the Bahamas' THEN 'BHS'
    WHEN 'Prince Hall Grand Lodge of the Caribbean and Jurisdiction' THEN 'CAR'
    WHEN 'Grand Lodge of the State of Baja California' THEN 'MEX'
    WHEN 'Grand Lodge Benemérito Ejército de Oriente of the State of Puebla' THEN 'MEX'
    WHEN 'York Grand Lodge of Mexico' THEN 'MEX'
    WHEN 'Grand Lodge of Argentina' THEN 'ARG'
    WHEN 'Grand Lodge of Chile' THEN 'CHL'
    WHEN 'Grand Lodge of Ecuador' THEN 'ECU'
    WHEN 'Symbolic Grand Lodge of Paraguay' THEN 'PRY'
    WHEN 'Grand Lodge of Peru' THEN 'PER'
    WHEN 'Grand Lodge of Uruguay' THEN 'URY'
    WHEN 'Grand Lodge of the Republic of Venezuela' THEN 'VEN'
  END,
  CASE o.name
    WHEN 'Grand Lodge of the State of Baja California' THEN 'Baja California'
    WHEN 'Grand Lodge Benemérito Ejército de Oriente of the State of Puebla' THEN 'Puebla'
    ELSE NULL
  END,
  CASE o.name
    WHEN 'Grand Lodge of the State of Baja California' THEN 'BC'
    WHEN 'Grand Lodge Benemérito Ejército de Oriente of the State of Puebla' THEN 'PUE'
    ELSE NULL
  END,
  o.organisation_id
FROM new_organisations o;