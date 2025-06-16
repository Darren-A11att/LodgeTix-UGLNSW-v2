-- Seed European Grand Lodges
WITH new_organisations AS (
  INSERT INTO public.organisations (name, type, country, abbreviation, known_as)
  VALUES 
    ('Grand Lodge of Austria', 'grandlodge', 'Austria', 'GLA', 'GLA'),
    ('Regular Grand Lodge of Belgium', 'grandlodge', 'Belgium', 'RGLB', 'RGLB'),
    ('Grand Lodge of Bosnia and Herzegovina', 'grandlodge', 'Bosnia and Herzegovina', 'GLBH', 'GLBH'),
    ('United Grand Lodge of Bulgaria', 'grandlodge', 'Bulgaria', 'UGLB', 'UGLB'),
    ('Grand Lodge of Croatia', 'grandlodge', 'Croatia', 'GLC', 'GLC'),
    ('Grand Lodge of Cyprus', 'grandlodge', 'Cyprus', 'GLC', 'GLC'),
    ('Grand Lodge of Czech Republic', 'grandlodge', 'Czech Republic', 'GLCR', 'GLCR'),
    ('Danish Order of Freemasons', 'grandlodge', 'Denmark', 'DOF', 'DOF'),
    ('Grand Lodge of Estonia', 'grandlodge', 'Estonia', 'GLE', 'GLE'),
    ('Grand Lodge of Finland', 'grandlodge', 'Finland', 'GLF', 'GLF'),
    ('Grand Lodge of Greece', 'grandlodge', 'Greece', 'GLG', 'GLG'),
    ('Symbolic Grand Lodge of Hungary', 'grandlodge', 'Hungary', 'SGLH', 'SGLH'),
    ('Icelandic Order of Freemasons', 'grandlodge', 'Iceland', 'IOF', 'IOF'),
    ('Grand Lodge of Macedonia', 'grandlodge', 'North Macedonia', 'GLM', 'GLM'),
    ('Grand Lodge of Moldova', 'grandlodge', 'Moldova', 'GLM', 'GLM'),
    ('National Regular Grand Lodge of the Principality of Monaco', 'grandlodge', 'Monaco', 'NRGLM', 'NRGLM'),
    ('Grand Lodge of Montenegro', 'grandlodge', 'Montenegro', 'GLM', 'GLM'),
    ('Grand East of the Netherlands', 'grandlodge', 'Netherlands', 'GEN', 'GEN'),
    ('Norwegian Order of Freemasons', 'grandlodge', 'Norway', 'NOF', 'NOF'),
    ('Regular Grand Lodge of Portugal (Legal)', 'grandlodge', 'Portugal', 'RGLP', 'RGLP'),
    ('National Grand Lodge of Romania', 'grandlodge', 'Romania', 'NGLR', 'NGLR'),
    ('Grand Lodge of Russia', 'grandlodge', 'Russia', 'GLR', 'GLR'),
    ('Grand Lodge of the Most Serene Republic of San Marino', 'grandlodge', 'San Marino', 'GLSM', 'GLSM'),
    ('Regular Grand Lodge of Serbia', 'grandlodge', 'Serbia', 'RGLS', 'RGLS'),
    ('Grand Lodge of Spain', 'grandlodge', 'Spain', 'GLS', 'GLS'),
    ('Swedish Order of Freemasons', 'grandlodge', 'Sweden', 'SOF', 'SOF'),
    ('Grand Lodge Alpina of Switzerland', 'grandlodge', 'Switzerland', 'GLAS', 'GLAS'),
    ('Grand Lodge of Ukraine', 'grandlodge', 'Ukraine', 'GLU', 'GLU')
  RETURNING organisation_id, name
)
INSERT INTO public.grand_lodges (name, country, abbreviation, country_code_iso3, organisation_id)
SELECT 
  o.name,
  CASE o.name
    WHEN 'Grand Lodge of Austria' THEN 'Austria'
    WHEN 'Regular Grand Lodge of Belgium' THEN 'Belgium'
    WHEN 'Grand Lodge of Bosnia and Herzegovina' THEN 'Bosnia and Herzegovina'
    WHEN 'United Grand Lodge of Bulgaria' THEN 'Bulgaria'
    WHEN 'Grand Lodge of Croatia' THEN 'Croatia'
    WHEN 'Grand Lodge of Cyprus' THEN 'Cyprus'
    WHEN 'Grand Lodge of Czech Republic' THEN 'Czech Republic'
    WHEN 'Danish Order of Freemasons' THEN 'Denmark'
    WHEN 'Grand Lodge of Estonia' THEN 'Estonia'
    WHEN 'Grand Lodge of Finland' THEN 'Finland'
    WHEN 'Grand Lodge of Greece' THEN 'Greece'
    WHEN 'Symbolic Grand Lodge of Hungary' THEN 'Hungary'
    WHEN 'Icelandic Order of Freemasons' THEN 'Iceland'
    WHEN 'Grand Lodge of Macedonia' THEN 'North Macedonia'
    WHEN 'Grand Lodge of Moldova' THEN 'Moldova'
    WHEN 'National Regular Grand Lodge of the Principality of Monaco' THEN 'Monaco'
    WHEN 'Grand Lodge of Montenegro' THEN 'Montenegro'
    WHEN 'Grand East of the Netherlands' THEN 'Netherlands'
    WHEN 'Norwegian Order of Freemasons' THEN 'Norway'
    WHEN 'Regular Grand Lodge of Portugal (Legal)' THEN 'Portugal'
    WHEN 'National Grand Lodge of Romania' THEN 'Romania'
    WHEN 'Grand Lodge of Russia' THEN 'Russia'
    WHEN 'Grand Lodge of the Most Serene Republic of San Marino' THEN 'San Marino'
    WHEN 'Regular Grand Lodge of Serbia' THEN 'Serbia'
    WHEN 'Grand Lodge of Spain' THEN 'Spain'
    WHEN 'Swedish Order of Freemasons' THEN 'Sweden'
    WHEN 'Grand Lodge Alpina of Switzerland' THEN 'Switzerland'
    WHEN 'Grand Lodge of Ukraine' THEN 'Ukraine'
  END,
  CASE o.name
    WHEN 'Grand Lodge of Austria' THEN 'GLA'
    WHEN 'Regular Grand Lodge of Belgium' THEN 'RGLB'
    WHEN 'Grand Lodge of Bosnia and Herzegovina' THEN 'GLBH'
    WHEN 'United Grand Lodge of Bulgaria' THEN 'UGLB'
    WHEN 'Grand Lodge of Croatia' THEN 'GLC'
    WHEN 'Grand Lodge of Cyprus' THEN 'GLC'
    WHEN 'Grand Lodge of Czech Republic' THEN 'GLCR'
    WHEN 'Danish Order of Freemasons' THEN 'DOF'
    WHEN 'Grand Lodge of Estonia' THEN 'GLE'
    WHEN 'Grand Lodge of Finland' THEN 'GLF'
    WHEN 'Grand Lodge of Greece' THEN 'GLG'
    WHEN 'Symbolic Grand Lodge of Hungary' THEN 'SGLH'
    WHEN 'Icelandic Order of Freemasons' THEN 'IOF'
    WHEN 'Grand Lodge of Macedonia' THEN 'GLM'
    WHEN 'Grand Lodge of Moldova' THEN 'GLM'
    WHEN 'National Regular Grand Lodge of the Principality of Monaco' THEN 'NRGLM'
    WHEN 'Grand Lodge of Montenegro' THEN 'GLM'
    WHEN 'Grand East of the Netherlands' THEN 'GEN'
    WHEN 'Norwegian Order of Freemasons' THEN 'NOF'
    WHEN 'Regular Grand Lodge of Portugal (Legal)' THEN 'RGLP'
    WHEN 'National Grand Lodge of Romania' THEN 'NGLR'
    WHEN 'Grand Lodge of Russia' THEN 'GLR'
    WHEN 'Grand Lodge of the Most Serene Republic of San Marino' THEN 'GLSM'
    WHEN 'Regular Grand Lodge of Serbia' THEN 'RGLS'
    WHEN 'Grand Lodge of Spain' THEN 'GLS'
    WHEN 'Swedish Order of Freemasons' THEN 'SOF'
    WHEN 'Grand Lodge Alpina of Switzerland' THEN 'GLAS'
    WHEN 'Grand Lodge of Ukraine' THEN 'GLU'
  END,
  CASE o.name
    WHEN 'Grand Lodge of Austria' THEN 'AUT'
    WHEN 'Regular Grand Lodge of Belgium' THEN 'BEL'
    WHEN 'Grand Lodge of Bosnia and Herzegovina' THEN 'BIH'
    WHEN 'United Grand Lodge of Bulgaria' THEN 'BGR'
    WHEN 'Grand Lodge of Croatia' THEN 'HRV'
    WHEN 'Grand Lodge of Cyprus' THEN 'CYP'
    WHEN 'Grand Lodge of Czech Republic' THEN 'CZE'
    WHEN 'Danish Order of Freemasons' THEN 'DNK'
    WHEN 'Grand Lodge of Estonia' THEN 'EST'
    WHEN 'Grand Lodge of Finland' THEN 'FIN'
    WHEN 'Grand Lodge of Greece' THEN 'GRC'
    WHEN 'Symbolic Grand Lodge of Hungary' THEN 'HUN'
    WHEN 'Icelandic Order of Freemasons' THEN 'ISL'
    WHEN 'Grand Lodge of Macedonia' THEN 'MKD'
    WHEN 'Grand Lodge of Moldova' THEN 'MDA'
    WHEN 'National Regular Grand Lodge of the Principality of Monaco' THEN 'MCO'
    WHEN 'Grand Lodge of Montenegro' THEN 'MNE'
    WHEN 'Grand East of the Netherlands' THEN 'NLD'
    WHEN 'Norwegian Order of Freemasons' THEN 'NOR'
    WHEN 'Regular Grand Lodge of Portugal (Legal)' THEN 'PRT'
    WHEN 'National Grand Lodge of Romania' THEN 'ROU'
    WHEN 'Grand Lodge of Russia' THEN 'RUS'
    WHEN 'Grand Lodge of the Most Serene Republic of San Marino' THEN 'SMR'
    WHEN 'Regular Grand Lodge of Serbia' THEN 'SRB'
    WHEN 'Grand Lodge of Spain' THEN 'ESP'
    WHEN 'Swedish Order of Freemasons' THEN 'SWE'
    WHEN 'Grand Lodge Alpina of Switzerland' THEN 'CHE'
    WHEN 'Grand Lodge of Ukraine' THEN 'UKR'
  END,
  o.organisation_id
FROM new_organisations o;