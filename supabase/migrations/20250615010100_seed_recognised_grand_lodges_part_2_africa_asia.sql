-- Seed African and Asian Grand Lodges
WITH new_organisations AS (
  INSERT INTO public.organisations (name, type, country, abbreviation, known_as)
  VALUES 
    -- African Grand Lodges
    ('Grand Lodge of Benin', 'grandlodge', 'Benin', 'GLB', 'GLB'),
    ('Grand Lodge of Burkina Faso', 'grandlodge', 'Burkina Faso', 'GLBF', 'GLBF'),
    ('Grand Lodge of Gabon', 'grandlodge', 'Gabon', 'GLG', 'GLG'),
    ('Grand Lodge of Ghana', 'grandlodge', 'Ghana', 'GLG', 'GLG'),
    ('Grand Lodge of Cote D''lvoire', 'grandlodge', 'Côte d''Ivoire', 'GLCI', 'GLCI'),
    ('Prince Hall Grand Lodge of Liberia', 'grandlodge', 'Liberia', 'PHGLL', 'PHGLL'),
    ('National Grand Lodge of Madagascar', 'grandlodge', 'Madagascar', 'NGLM', 'NGLM'),
    ('Grand Lodge of Mauritius', 'grandlodge', 'Mauritius', 'GLM', 'GLM'),
    ('Grand Lodge of Senegal', 'grandlodge', 'Senegal', 'GLS', 'GLS'),
    ('National Grand Lodge of Togo', 'grandlodge', 'Togo', 'NGLT', 'NGLT'),
    -- Asian Grand Lodges
    ('Grand Lodge of China', 'grandlodge', 'Taiwan', 'GLC', 'GLC'),
    ('Grand Lodge of the State of Israel', 'grandlodge', 'Israel', 'GLSI', 'GLSI'),
    ('Grand Lodge of Kazakhastan', 'grandlodge', 'Kazakhstan', 'GLK', 'GLK'),
    ('Grand Lodge of Turkey', 'grandlodge', 'Turkey', 'GLT', 'GLT')
  RETURNING organisation_id, name
)
INSERT INTO public.grand_lodges (name, country, abbreviation, country_code_iso3, organisation_id)
SELECT 
  o.name,
  CASE o.name
    WHEN 'Grand Lodge of Benin' THEN 'Benin'
    WHEN 'Grand Lodge of Burkina Faso' THEN 'Burkina Faso'
    WHEN 'Grand Lodge of Gabon' THEN 'Gabon'
    WHEN 'Grand Lodge of Ghana' THEN 'Ghana'
    WHEN 'Grand Lodge of Cote D''lvoire' THEN 'Côte d''Ivoire'
    WHEN 'Prince Hall Grand Lodge of Liberia' THEN 'Liberia'
    WHEN 'National Grand Lodge of Madagascar' THEN 'Madagascar'
    WHEN 'Grand Lodge of Mauritius' THEN 'Mauritius'
    WHEN 'Grand Lodge of Senegal' THEN 'Senegal'
    WHEN 'National Grand Lodge of Togo' THEN 'Togo'
    WHEN 'Grand Lodge of China' THEN 'Taiwan'
    WHEN 'Grand Lodge of the State of Israel' THEN 'Israel'
    WHEN 'Grand Lodge of Kazakhastan' THEN 'Kazakhstan'
    WHEN 'Grand Lodge of Turkey' THEN 'Turkey'
  END,
  CASE o.name
    WHEN 'Grand Lodge of Benin' THEN 'GLB'
    WHEN 'Grand Lodge of Burkina Faso' THEN 'GLBF'
    WHEN 'Grand Lodge of Gabon' THEN 'GLG'
    WHEN 'Grand Lodge of Ghana' THEN 'GLG'
    WHEN 'Grand Lodge of Cote D''lvoire' THEN 'GLCI'
    WHEN 'Prince Hall Grand Lodge of Liberia' THEN 'PHGLL'
    WHEN 'National Grand Lodge of Madagascar' THEN 'NGLM'
    WHEN 'Grand Lodge of Mauritius' THEN 'GLM'
    WHEN 'Grand Lodge of Senegal' THEN 'GLS'
    WHEN 'National Grand Lodge of Togo' THEN 'NGLT'
    WHEN 'Grand Lodge of China' THEN 'GLC'
    WHEN 'Grand Lodge of the State of Israel' THEN 'GLSI'
    WHEN 'Grand Lodge of Kazakhastan' THEN 'GLK'
    WHEN 'Grand Lodge of Turkey' THEN 'GLT'
  END,
  CASE o.name
    WHEN 'Grand Lodge of Benin' THEN 'BEN'
    WHEN 'Grand Lodge of Burkina Faso' THEN 'BFA'
    WHEN 'Grand Lodge of Gabon' THEN 'GAB'
    WHEN 'Grand Lodge of Ghana' THEN 'GHA'
    WHEN 'Grand Lodge of Cote D''lvoire' THEN 'CIV'
    WHEN 'Prince Hall Grand Lodge of Liberia' THEN 'LBR'
    WHEN 'National Grand Lodge of Madagascar' THEN 'MDG'
    WHEN 'Grand Lodge of Mauritius' THEN 'MUS'
    WHEN 'Grand Lodge of Senegal' THEN 'SEN'
    WHEN 'National Grand Lodge of Togo' THEN 'TGO'
    WHEN 'Grand Lodge of China' THEN 'TWN'
    WHEN 'Grand Lodge of the State of Israel' THEN 'ISR'
    WHEN 'Grand Lodge of Kazakhastan' THEN 'KAZ'
    WHEN 'Grand Lodge of Turkey' THEN 'TUR'
  END,
  o.organisation_id
FROM new_organisations o;