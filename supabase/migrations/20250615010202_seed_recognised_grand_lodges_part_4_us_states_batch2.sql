-- Seed US State Grand Lodges - Batch 2 (Kentucky - New Mexico)
WITH new_organisations AS (
  INSERT INTO public.organisations (name, type, country, state, abbreviation, known_as)
  VALUES 
    ('Grand Lodge of Kentucky', 'grandlodge', 'United States', 'Kentucky', 'GLKY', 'GLKY'),
    ('Grand Lodge of Louisiana', 'grandlodge', 'United States', 'Louisiana', 'GLLA', 'GLLA'),
    ('Grand Lodge of Maine', 'grandlodge', 'United States', 'Maine', 'GLME', 'GLME'),
    ('Grand Lodge of Maryland', 'grandlodge', 'United States', 'Maryland', 'GLMD', 'GLMD'),
    ('Grand Lodge of Massachusetts', 'grandlodge', 'United States', 'Massachusetts', 'GLMA', 'GLMA'),
    ('Grand Lodge of Michigan', 'grandlodge', 'United States', 'Michigan', 'GLMI', 'GLMI'),
    ('Grand Lodge of Minnesota', 'grandlodge', 'United States', 'Minnesota', 'GLMN', 'GLMN'),
    ('Grand Lodge of Mississippi', 'grandlodge', 'United States', 'Mississippi', 'GLMS', 'GLMS'),
    ('Grand Lodge of Missouri', 'grandlodge', 'United States', 'Missouri', 'GLMO', 'GLMO'),
    ('Grand Lodge of Montana', 'grandlodge', 'United States', 'Montana', 'GLMT', 'GLMT'),
    ('Grand Lodge of Nebraska', 'grandlodge', 'United States', 'Nebraska', 'GLNE', 'GLNE'),
    ('Grand Lodge of Nevada', 'grandlodge', 'United States', 'Nevada', 'GLNV', 'GLNV'),
    ('Grand Lodge of New Hampshire', 'grandlodge', 'United States', 'New Hampshire', 'GLNH', 'GLNH'),
    ('Grand Lodge of New Jersey', 'grandlodge', 'United States', 'New Jersey', 'GLNJ', 'GLNJ'),
    ('Grand Lodge of New Mexico', 'grandlodge', 'United States', 'New Mexico', 'GLNM', 'GLNM')
  RETURNING organisation_id, name
)
INSERT INTO public.grand_lodges (name, country, abbreviation, country_code_iso3, state_region, state_region_code, organisation_id)
SELECT 
  o.name,
  'United States',
  CASE o.name
    WHEN 'Grand Lodge of Kentucky' THEN 'GLKY'
    WHEN 'Grand Lodge of Louisiana' THEN 'GLLA'
    WHEN 'Grand Lodge of Maine' THEN 'GLME'
    WHEN 'Grand Lodge of Maryland' THEN 'GLMD'
    WHEN 'Grand Lodge of Massachusetts' THEN 'GLMA'
    WHEN 'Grand Lodge of Michigan' THEN 'GLMI'
    WHEN 'Grand Lodge of Minnesota' THEN 'GLMN'
    WHEN 'Grand Lodge of Mississippi' THEN 'GLMS'
    WHEN 'Grand Lodge of Missouri' THEN 'GLMO'
    WHEN 'Grand Lodge of Montana' THEN 'GLMT'
    WHEN 'Grand Lodge of Nebraska' THEN 'GLNE'
    WHEN 'Grand Lodge of Nevada' THEN 'GLNV'
    WHEN 'Grand Lodge of New Hampshire' THEN 'GLNH'
    WHEN 'Grand Lodge of New Jersey' THEN 'GLNJ'
    WHEN 'Grand Lodge of New Mexico' THEN 'GLNM'
  END,
  'USA',
  CASE o.name
    WHEN 'Grand Lodge of Kentucky' THEN 'Kentucky'
    WHEN 'Grand Lodge of Louisiana' THEN 'Louisiana'
    WHEN 'Grand Lodge of Maine' THEN 'Maine'
    WHEN 'Grand Lodge of Maryland' THEN 'Maryland'
    WHEN 'Grand Lodge of Massachusetts' THEN 'Massachusetts'
    WHEN 'Grand Lodge of Michigan' THEN 'Michigan'
    WHEN 'Grand Lodge of Minnesota' THEN 'Minnesota'
    WHEN 'Grand Lodge of Mississippi' THEN 'Mississippi'
    WHEN 'Grand Lodge of Missouri' THEN 'Missouri'
    WHEN 'Grand Lodge of Montana' THEN 'Montana'
    WHEN 'Grand Lodge of Nebraska' THEN 'Nebraska'
    WHEN 'Grand Lodge of Nevada' THEN 'Nevada'
    WHEN 'Grand Lodge of New Hampshire' THEN 'New Hampshire'
    WHEN 'Grand Lodge of New Jersey' THEN 'New Jersey'
    WHEN 'Grand Lodge of New Mexico' THEN 'New Mexico'
  END,
  CASE o.name
    WHEN 'Grand Lodge of Kentucky' THEN 'KY'
    WHEN 'Grand Lodge of Louisiana' THEN 'LA'
    WHEN 'Grand Lodge of Maine' THEN 'ME'
    WHEN 'Grand Lodge of Maryland' THEN 'MD'
    WHEN 'Grand Lodge of Massachusetts' THEN 'MA'
    WHEN 'Grand Lodge of Michigan' THEN 'MI'
    WHEN 'Grand Lodge of Minnesota' THEN 'MN'
    WHEN 'Grand Lodge of Mississippi' THEN 'MS'
    WHEN 'Grand Lodge of Missouri' THEN 'MO'
    WHEN 'Grand Lodge of Montana' THEN 'MT'
    WHEN 'Grand Lodge of Nebraska' THEN 'NE'
    WHEN 'Grand Lodge of Nevada' THEN 'NV'
    WHEN 'Grand Lodge of New Hampshire' THEN 'NH'
    WHEN 'Grand Lodge of New Jersey' THEN 'NJ'
    WHEN 'Grand Lodge of New Mexico' THEN 'NM'
  END,
  o.organisation_id
FROM new_organisations o;