-- Seed Brazilian Grand Lodges - Batch 1
WITH new_organisations AS (
  INSERT INTO public.organisations (name, type, country, state, abbreviation, known_as)
  VALUES 
    ('Grand Lodge of the State of Acre', 'grandlodge', 'Brazil', 'Acre', 'GLAC', 'GLAC'),
    ('Grand Lodge of the State of Amazonas', 'grandlodge', 'Brazil', 'Amazonas', 'GLAM', 'GLAM'),
    ('Grand Lodge of the State of Bahia', 'grandlodge', 'Brazil', 'Bahia', 'GLBA', 'GLBA'),
    ('Grand Lodge of the State of Ceará', 'grandlodge', 'Brazil', 'Ceará', 'GLCE', 'GLCE'),
    ('Grand Lodge of the State of Espírito Santo', 'grandlodge', 'Brazil', 'Espírito Santo', 'GLES', 'GLES'),
    ('Grand Lodge of the State of Maranhão', 'grandlodge', 'Brazil', 'Maranhão', 'GLMA', 'GLMA'),
    ('Grand Lodge of the State of Mato Grosso', 'grandlodge', 'Brazil', 'Mato Grosso', 'GLMT', 'GLMT'),
    ('Grand Orient of the State of Mato Grosso', 'grandlodge', 'Brazil', 'Mato Grosso', 'GOMT', 'GOMT'),
    ('Grand Lodge of the State of Minas Gerais', 'grandlodge', 'Brazil', 'Minas Gerais', 'GLMG', 'GLMG'),
    ('Grand Orient of Minas Gerais', 'grandlodge', 'Brazil', 'Minas Gerais', 'GOMG', 'GOMG')
  RETURNING organisation_id, name
)
INSERT INTO public.grand_lodges (name, country, abbreviation, country_code_iso3, state_region, state_region_code, organisation_id)
SELECT 
  o.name,
  'Brazil',
  CASE o.name
    WHEN 'Grand Lodge of the State of Acre' THEN 'GLAC'
    WHEN 'Grand Lodge of the State of Amazonas' THEN 'GLAM'
    WHEN 'Grand Lodge of the State of Bahia' THEN 'GLBA'
    WHEN 'Grand Lodge of the State of Ceará' THEN 'GLCE'
    WHEN 'Grand Lodge of the State of Espírito Santo' THEN 'GLES'
    WHEN 'Grand Lodge of the State of Maranhão' THEN 'GLMA'
    WHEN 'Grand Lodge of the State of Mato Grosso' THEN 'GLMT'
    WHEN 'Grand Orient of the State of Mato Grosso' THEN 'GOMT'
    WHEN 'Grand Lodge of the State of Minas Gerais' THEN 'GLMG'
    WHEN 'Grand Orient of Minas Gerais' THEN 'GOMG'
  END,
  'BRA',
  CASE o.name
    WHEN 'Grand Lodge of the State of Acre' THEN 'Acre'
    WHEN 'Grand Lodge of the State of Amazonas' THEN 'Amazonas'
    WHEN 'Grand Lodge of the State of Bahia' THEN 'Bahia'
    WHEN 'Grand Lodge of the State of Ceará' THEN 'Ceará'
    WHEN 'Grand Lodge of the State of Espírito Santo' THEN 'Espírito Santo'
    WHEN 'Grand Lodge of the State of Maranhão' THEN 'Maranhão'
    WHEN 'Grand Lodge of the State of Mato Grosso' THEN 'Mato Grosso'
    WHEN 'Grand Orient of the State of Mato Grosso' THEN 'Mato Grosso'
    WHEN 'Grand Lodge of the State of Minas Gerais' THEN 'Minas Gerais'
    WHEN 'Grand Orient of Minas Gerais' THEN 'Minas Gerais'
  END,
  CASE o.name
    WHEN 'Grand Lodge of the State of Acre' THEN 'AC'
    WHEN 'Grand Lodge of the State of Amazonas' THEN 'AM'
    WHEN 'Grand Lodge of the State of Bahia' THEN 'BA'
    WHEN 'Grand Lodge of the State of Ceará' THEN 'CE'
    WHEN 'Grand Lodge of the State of Espírito Santo' THEN 'ES'
    WHEN 'Grand Lodge of the State of Maranhão' THEN 'MA'
    WHEN 'Grand Lodge of the State of Mato Grosso' THEN 'MT'
    WHEN 'Grand Orient of the State of Mato Grosso' THEN 'MT'
    WHEN 'Grand Lodge of the State of Minas Gerais' THEN 'MG'
    WHEN 'Grand Orient of Minas Gerais' THEN 'MG'
  END,
  o.organisation_id
FROM new_organisations o;