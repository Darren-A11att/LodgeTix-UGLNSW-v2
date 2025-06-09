-- Production data seed file
  -- Generated on: 2025-06-09
  BEGIN;

  -- Locations
INSERT INTO locations (location_id, place_name, street_address, suburb, state, postal_code, country, description, capacity) VALUES ('90221696-ce68-432d-b2a5-d35451299c55', 'Sydney Harbour', NULL, NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT 
  (location_id) DO NOTHING;
INSERT INTO locations (location_id, place_name, street_address, suburb, state, postal_code, country, description, capacity) VALUES ('18542763-954b-44ce-845b-5a80fd1c4fc9', 'Sydney Masonic Centre', '66 Goulburn Street', 'Sydney', 'NSW', '2000', 'Australia', NULL, NULL) ON CONFLICT 
  (location_id) DO NOTHING;

-- Organisations
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('63709117-f1a2-4167-859a-ce83553e1b6d', 'United Grand Lodge of Victoria', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('0ceb5559-cac7-4f52-b518-37a091cef550', 'United Grand Lodge of Queensland', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('39864db0-15f8-4faa-8706-8d7c942f8017', 'Grand Lodge of South Australia & Northern Territory', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('e0956d32-27ec-47ec-b21a-47ac342473a3', 'Grand Lodge of Western Australia', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('316024c6-e8a7-42bc-96ab-3f9532307242', 'Grand Lodge of Tasmania', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('1cbc120c-7651-4df9-b73b-77a94e8c93d6', 'Grand Lodge of New Zealand', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('0ce8e42a-e50f-46f8-bcee-c5e9eb97086b', 'Most Worshipful Grand Lodge of Philippines', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('ba2f613f-8392-4d24-bc32-ab9d25815af0', 'Most Worshipful Grand Lodge of Japan', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('c05e862c-0ad7-4456-900a-38ddd54b9b70', 'Provincial Grand Lodge of New Caledonia', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('94648869-9947-44b6-a202-40a0d2fe50ea', 'Grand Lodge of Quebec', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('9eb35de9-ac57-4938-966e-d50e5bdaf297', 'United Grand Lodge of England', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('e3099e8e-c195-4996-a989-c4d181ec148f', 'Grand Lodge of Scotland', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('05393618-7e21-434a-b054-73d3d99b247c', 'Grand Lodge of Ireland', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('88f99adf-eb30-4a5c-aac9-1dc83c159e0c', 'Grand Lodge of Canada in the Province of Ontario', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('4c4d7c78-6dfe-46c6-8b94-a8be0ef6e013', 'Grand Lodge of British Columbia and Yukon', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('726ada36-0777-4d21-a766-69dcc6dfd11f', 'Grand Lodge of Alberta', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('930f67ef-533b-402c-86fb-b35682b69b1a', 'Grand Lodge of Saskatchewan', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('66af1b27-44b5-428c-895d-84a2e82ce2cc', 'Grand Lodge of Manitoba', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('5f4fc792-62c9-4e05-a843-d56fba62b2b3', 'Grand Lodge of Nova Scotia', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('c890a8e9-ac56-4d12-81f9-49ce3c9e4e01', 'Grand Lodge of New Brunswick', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('bc93edb8-2a34-4dc6-a893-b89b95ec10f6', 'Grand Lodge of Prince Edward Island', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('c1c3f9a0-e44f-4b5f-9e9f-c8cb56cf2f6f', 'Grand Lodge of Newfoundland and Labrador', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('3b0dbacb-3fb6-4a09-9c7c-feb0b2b2f54d', 'Grand Lodge of Connecticut', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('3cbee59e-6c21-486f-bb08-01c2b6015bc9', 'Grand Lodge of Delaware', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('4fb5b327-1c59-4e95-a16e-7fca95aeb64e', 'Grand Lodge of the District of Columbia', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('0ba0c52f-00f6-4bfe-a5e0-01f4a088e0f6', 'Grand Lodge of Florida', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('7e7e2e60-e456-46f9-b66e-9fb1b72c2d7f', 'Grand Lodge of Georgia', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('e7e29e89-ef30-4e67-90f8-a39f8b7e7e8f', 'Grand Lodge of Hawaii', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('6dc6bce1-b89f-4f4e-899e-e8cfbfe7bbfb', 'Grand Lodge of Idaho', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('d2d7e5d8-11a0-4fb4-8f1f-bb5f2e5e7b6e', 'Grand Lodge of Illinois', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('4b4f5f5f-a456-45f0-a1e7-fc0a1f6f1efc', 'Grand Lodge of Indiana', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('f0bf5e4f-b78f-489f-8bc9-a5dfcfce5eff', 'Grand Lodge of Iowa', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('f5e5e7c8-af34-40f8-8f9e-6ff9cf0f3efa', 'Grand Lodge of Kansas', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('7e8fc5e9-ff89-4f23-b34c-fcc0a0ffbebf', 'Grand Lodge of Kentucky', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('e9cf7dcf-bffa-4f80-899f-afca7efcedfa', 'Grand Lodge of Louisiana', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('f7fef9fa-ffab-4089-a1fa-f8ba8fdeffff', 'Grand Lodge of Maine', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('dcdf5ef7-e4fa-489f-b890-fcca0fffe3fe', 'Grand Lodge of Maryland', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('a7b8cdfa-e4f9-4fc0-bf7a-fedffffabfef', 'Grand Lodge of Massachusetts', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('ecdfcfaf-bcdb-45f0-8e5e-acdcdfa6fafc', 'Grand Lodge of Michigan', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('dfa6faca-b5f0-478f-899f-8faffe8feffd', 'Grand Lodge of Minnesota', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('fafef8c0-c9f0-45f8-a456-f8f9ca8f0fcf', 'Grand Lodge of Mississippi', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('cf8f0fc9-a6b8-4fc9-bc78-f0bfc3f8cfaf', 'Grand Lodge of Missouri', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('f9cfc3f8-b679-4fc0-8f90-acacfc1f0fcf', 'Grand Lodge of Montana', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('afc0ffc8-c3fa-45f8-a67c-cfc8cf9fcafe', 'Grand Lodge of Nebraska', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('fcf8fc9f-cbf8-45b0-8fc6-f8fc5fc1fcac', 'Grand Lodge of Nevada', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('fccfc1fa-f8b9-45f0-8fca-fcacfac9fcff', 'Grand Lodge of New Hampshire', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('acfc9fcf-f9af-45fa-8bc5-cffc8fcafccf', 'Grand Lodge of New Jersey', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('cffc8fca-b8c9-456f-af78-fcafacacfcfa', 'Grand Lodge of New Mexico', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('fcafcacf-a5f9-45fa-8fc0-facafcfafcfc', 'Grand Lodge of New York', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('facafcfa-b4fc-45fa-8fc9-afcfacfafcac', 'Grand Lodge of North Carolina', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('afcfacfa-c8af-45bc-8fcf-afcafcafafcf', 'Grand Lodge of North Dakota', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('afcafcaf-b5fa-45fc-8fc0-facafcfafcca', 'Grand Lodge of Ohio', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('facafcfa-f9c8-45fc-8bc0-afcafcafcafc', 'Grand Lodge of Oklahoma', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('afcafcaf-a5f8-45fc-8bc9-cafcafacfcfc', 'Grand Lodge of Oregon', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('cafcafac-bcfa-45fc-8f90-facafcfafcac', 'Grand Lodge of Pennsylvania', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('facafcfa-f8b0-45fc-8fc9-cfacafcfaffc', 'Grand Lodge of Rhode Island', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('cfacafcf-a5fc-45fc-8bcf-acafcfafafcc', 'Grand Lodge of South Carolina', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('acafcfaf-b9ca-45fc-8fca-fcafcafcfacf', 'Grand Lodge of South Dakota', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('fcafcafc-f8bc-45fc-8bc0-afcfacfafacc', 'Grand Lodge of Tennessee', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('afcfacfa-f5a9-45fc-8fc9-cafcafcfacfc', 'Grand Lodge of Texas', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('cafcafcf-bc8f-45fc-8fc0-facfacfafcac', 'Grand Lodge of Utah', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('facfacfa-f9bc-45fc-8bc9-cafcafcfacaf', 'Grand Lodge of Vermont', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('cafcafcf-a5f0-45fc-8fc0-afcafcfafcfa', 'Grand Lodge of Virginia', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('afcafcfa-b8cf-45fc-8bcf-facafcfafcaf', 'Grand Lodge of Washington', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('facafcfa-f9b8-45fc-8fc9-cafcfacfafca', 'Grand Lodge of West Virginia', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('cafcfacf-a5bc-45fc-8bc0-afcafcfafacf', 'Grand Lodge of Wisconsin', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('afcafcfa-bcf9-45fc-8fc9-facafcfacfaf', 'Grand Lodge of Wyoming', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('f8b7e97e-8aea-4e63-bbef-ee5bfcf5f5f0', 'Grand Lodge of Alabama', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('8ff2df4f-7fb8-4f2f-8f0a-abfa1bfceebf', 'Grand Lodge of Alaska', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('0fbefa9b-f89e-4f8f-9e8e-facbc1cafcf0', 'Grand Lodge of Arizona', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('febfcfcf-abfe-4e9f-8bca-afc2bfafafcf', 'Grand Lodge of Arkansas', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('c1bf5f1f-cf67-4f56-a1ef-eafcebcfdffe', 'Grand Lodge of California', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('aebf8fcf-ef89-45f8-8abc-afa2bfcfccfa', 'Grand Lodge of Colorado', NULL, 'grandlodge', NULL, NULL, NULL, NULL) ON CONFLICT (organisation_id) DO 
  NOTHING;
INSERT INTO organisations (organisation_id, name, abbreviation, type, known_as, city, state, country) VALUES ('9b25ab94-d64e-4f46-9a95-88e7fde4c9a6', 'United Grand Lodge of NSW & ACT', 'UGLNSW&ACT', 'grandlodge', 'United Grand Lodge of NSW & ACT', 'Sydney', 'NSW', 'Australia') ON CONFLICT (organisation_id) DO 
  NOTHING;

-- Functions
INSERT INTO functions (function_id, name, slug, description, start_date, end_date, location_id, organiser_id, is_published, image_url) VALUES ('eebddef5-6833-43e3-8d32-700508b1c089', 'Grand Proclamation 2025', 'grand-proclamation-2025', 'Celebrate and witness the Grand Proclamation of the Grand Master and his Installation. It is an honour and privilege to join together for this momentous occasion which occurs once every 2 years.', '2025-09-18 10:00:00+00', '2025-09-21 15:00:00+00', '18542763-954b-44ce-845b-5a80fd1c4fc9', '9b25ab94-d64e-4f46-9a95-88e7fde4c9a6', 't', 
  'https://group.schindler.com/content/dam/website/global/images/references/sydney-masonic-centre/sydney-masonic-centre-australia-building-exterior.jpg/_jcr_content/renditions/original./sydney-masonic-centre-australia-building-exterior.jpg') ON CONFLICT (function_id) DO NOTHING;

-- Events with subtitles
INSERT INTO events (event_id, function_id, location_id, title, subtitle, slug, description, event_start, event_end, type, is_published) VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'eebddef5-6833-43e3-8d32-700508b1c089', '18542763-954b-44ce-845b-5a80fd1c4fc9', 'Ladies Brunch', 'A morning of fellowship for the ladies', 'ladies-brunch', 'A delightful morning event for the ladies during the Grand Proclamation weekend. Enjoy good company and conversation in a relaxed setting.', '2025-09-20 10:15:00+00', '2025-09-20 12:00:00+00', 
  'Social', 't') ON CONFLICT (event_id) DO NOTHING;
INSERT INTO events (event_id, function_id, location_id, title, subtitle, slug, description, event_start, event_end, type, is_published) VALUES ('d19d0c78-bf04-48a3-b8c5-7b9724079451', 'eebddef5-6833-43e3-8d32-700508b1c089', '18542763-954b-44ce-845b-5a80fd1c4fc9', 'Quarterly Communication', 'September 2025 Quarterly Communication', 'september-quarterly-communication', 'The Quarterly Communication of the United Grand Lodge of NSW & ACT. This formal meeting includes reports, business matters, and important announcements for the jurisdiction.', '2025-09-20 13:00:00+00', '2025-09-20 14:00:00+00', 
  'Meeting', 't') ON CONFLICT (event_id) DO NOTHING;
INSERT INTO events (event_id, function_id, location_id, title, subtitle, slug, description, event_start, event_end, type, is_published) VALUES ('6c12952b-7cf3-4d6a-81bd-1ac3b7ff7076', 'eebddef5-6833-43e3-8d32-700508b1c089', '18542763-954b-44ce-845b-5a80fd1c4fc9', 'Grand Proclamation Ceremony', 'Installation of the Grand Master and Officers', 'grand-proclamation-ceremony', 'The formal ceremony for the Proclamation of the Grand Master and his officers. This is the main event of the weekend featuring traditional Masonic ritual and pageantry.', '2025-09-20 14:45:00+00', '2025-09-20 17:00:00+00', 
  'Ceremony', 't') ON CONFLICT (event_id) DO NOTHING;
INSERT INTO events (event_id, function_id, location_id, title, subtitle, slug, description, event_start, event_end, type, is_published) VALUES ('e842bdb2-aff8-46d8-a347-bf50840fff13', 'eebddef5-6833-43e3-8d32-700508b1c089', '90221696-ce68-432d-b2a5-d35451299c55', 'Meet & Greet Cocktail Party', 'An evening of fellowship and friendship', 'welcome-reception', 'Start your Grand Proclamation weekend with a casual welcome reception. Meet and greet fellow attendees from around the world in a relaxed atmosphere.', '2025-09-19 19:00:00+00', '2025-09-19 21:00:00+00', 
  'Social', 't') ON CONFLICT (event_id) DO NOTHING;
INSERT INTO events (event_id, function_id, location_id, title, subtitle, slug, description, event_start, event_end, type, is_published) VALUES ('03a51924-1606-47c9-838d-9dc32657cd59', 'eebddef5-6833-43e3-8d32-700508b1c089', '18542763-954b-44ce-845b-5a80fd1c4fc9', 'Grand Proclamation Banquet', 'A night of celebration and fine dining', 'grand-proclamation-gala-dinner', 'A formal black-tie dinner celebrating the Grand Proclamation. The evening will include fine dining, entertainment, and addresses from distinguished guests.', '2025-09-20 18:30:00+00', '2025-09-20 23:00:00+00', 
  'Social', 't') ON CONFLICT (event_id) DO NOTHING;
INSERT INTO events (event_id, function_id, location_id, title, subtitle, slug, description, event_start, event_end, type, is_published) VALUES ('567fa008-40de-4f87-89f5-900933f898b2', 'eebddef5-6833-43e3-8d32-700508b1c089', '18542763-954b-44ce-845b-5a80fd1c4fc9', 'Farewell Cruise Luncheon', 'Scenic harbour cruise with farewell luncheon', 'farewell-lunch', 'Conclude your Grand Proclamation weekend with a relaxed lunch. Share memories and farewells with new and old friends before departing.', '2025-09-21 11:00:00+00', '2025-09-21 15:00:00+00', 
  'Social', 't') ON CONFLICT (event_id) DO NOTHING;

-- Event Tickets
INSERT INTO event_tickets (event_ticket_id, event_id, name, description, price, total_capacity, available_count, status, is_active, eligibility_criteria) VALUES ('a1b2c3d4-e5f6-2890-bcde-f12345678901', 'e842bdb2-aff8-46d8-a347-bf50840fff13', 'Meet & Greet Cocktail Party', NULL, 
  '135', '250', '250', 'Active', 't', '{"rules": []}') ON CONFLICT (event_ticket_id) DO NOTHING;
INSERT INTO event_tickets (event_ticket_id, event_id, name, description, price, total_capacity, available_count, status, is_active, eligibility_criteria) VALUES ('e5f6a7b8-c9d0-3234-efab-345678901234', 'd19d0c78-bf04-48a3-b8c5-7b9724079451', 'Quarterly Communication', NULL, 
  '20', '500', '500', 'Active', 't', '{"rules": [{"type": "attendee_type", "value": "mason", "operator": "equals"}, {"type": "grand_lodge", "value": "UGLNSWACT", "operator": "equals"}], "operator": "AND"}') ON CONFLICT (event_ticket_id) DO NOTHING;
INSERT INTO event_tickets (event_ticket_id, event_id, name, description, price, total_capacity, available_count, status, is_active, eligibility_criteria) VALUES ('f6a7b8c9-d0e1-4345-fabc-456789012345', '6c12952b-7cf3-4d6a-81bd-1ac3b7ff7076', 'Grand Proclamation Ceremony - 4th Floor', NULL, 
  '0', '100', '100', 'Active', 't', '{"rules": []}') ON CONFLICT (event_ticket_id) DO NOTHING;
INSERT INTO event_tickets (event_ticket_id, event_id, name, description, price, total_capacity, available_count, status, is_active, eligibility_criteria) VALUES ('a7b8c9d0-e1f2-5456-abcd-567890123456', '6c12952b-7cf3-4d6a-81bd-1ac3b7ff7076', 'Grand Proclamation Ceremony - Mezzanine', NULL, 
  '0', '100', '100', 'Active', 't', '{"rules": []}') ON CONFLICT (event_ticket_id) DO NOTHING;
INSERT INTO event_tickets (event_ticket_id, event_id, name, description, price, total_capacity, available_count, status, is_active, eligibility_criteria) VALUES ('b8c9d0e1-f2a3-6567-bcde-678901234567', '6c12952b-7cf3-4d6a-81bd-1ac3b7ff7076', 'Grand Proclamation Ceremony - 3rd Floor', NULL, 
  '0', '100', '100', 'Active', 't', '{"rules": []}') ON CONFLICT (event_ticket_id) DO NOTHING;
INSERT INTO event_tickets (event_ticket_id, event_id, name, description, price, total_capacity, available_count, status, is_active, eligibility_criteria) VALUES ('c9d0e1f2-a3b4-7678-cdef-789012345678', '567fa008-40de-4f87-89f5-900933f898b2', 'Farewell Cruise Luncheon', NULL, 
  '145', '200', '200', 'Active', 't', '{"rules": []}') ON CONFLICT (event_ticket_id) DO NOTHING;
INSERT INTO event_tickets (event_ticket_id, event_id, name, description, price, total_capacity, available_count, status, is_active, eligibility_criteria) VALUES ('a1b2c3d4-e5f6-3890-bcde-f12345678901', '03a51924-1606-47c9-838d-9dc32657cd59', 'Grand Proclamation Banquet - 4th Floor', NULL, 
  '115', '30', '30', 'Active', 't', '{"rules": []}') ON CONFLICT (event_ticket_id) DO NOTHING;
INSERT INTO event_tickets (event_ticket_id, event_id, name, description, price, total_capacity, available_count, status, is_active, eligibility_criteria) VALUES ('b2c3d4e5-f6a7-4891-bcde-f23456789012', '03a51924-1606-47c9-838d-9dc32657cd59', 'Grand Proclamation Banquet - Mezzanine', NULL, 
  '115', '30', '30', 'Active', 't', '{"rules": []}') ON CONFLICT (event_ticket_id) DO NOTHING;
INSERT INTO event_tickets (event_ticket_id, event_id, name, description, price, total_capacity, available_count, status, is_active, eligibility_criteria) VALUES ('c3d4e5f6-a7b8-4923-cdef-345678901234', '03a51924-1606-47c9-838d-9dc32657cd59', 'Grand Proclamation Banquet - 3rd Floor', NULL, 
  '115', '30', '30', 'Active', 't', '{"rules": []}') ON CONFLICT (event_ticket_id) DO NOTHING;
INSERT INTO event_tickets (event_ticket_id, event_id, name, description, price, total_capacity, available_count, status, is_active, eligibility_criteria) VALUES ('d4e5f6a7-b8c9-4567-def0-456789012345', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Ladies Brunch', NULL, 
  '50', '100', '100', 'Active', 't', '{"rules": []}') ON CONFLICT (event_ticket_id) DO NOTHING;

-- Packages
INSERT INTO packages (package_id, function_id, name, description, package_price, is_active, eligibility_criteria, registration_types) VALUES ('08c77893-85a3-46a5-a04a-99e5fa896662', 'eebddef5-6833-43e3-8d32-700508b1c089', 'Communication, Ceremony & Banquet', 'Quarterly Communication, Grand Proclamation Ceremony and Banquet', '135.00', 't', '{"rules": [{"type": "attendee_type", "value": "mason", "operator": "equals"}, {"type": "grand_lodge", "value": "UGLNSWACT", "operator": "equals"}], "operator": "AND"}', '{individuals,delegations}') ON 
  CONFLICT (package_id) DO NOTHING;
INSERT INTO packages (package_id, function_id, name, description, package_price, is_active, eligibility_criteria, registration_types) VALUES ('46c2dbe0-708e-47be-9046-a4ff597a8158', 'eebddef5-6833-43e3-8d32-700508b1c089', 'Ceremony & Banquet', 'Grand Proclamation Ceremony and Banquet', '135.00', 't', '{"rules": []}', '{individuals,delegations}') ON 
  CONFLICT (package_id) DO NOTHING;
INSERT INTO packages (package_id, function_id, name, description, package_price, is_active, eligibility_criteria, registration_types) VALUES ('88567b9c-9675-4ee2-b572-eace1c580eb4', 'eebddef5-6833-43e3-8d32-700508b1c089', 'All Events', 'Complete Grand Proclamation 2025 experience including all events', '280.00', 't', '{"rules": []}', '{individuals,delegations}') ON 
  CONFLICT (package_id) DO NOTHING;
INSERT INTO packages (package_id, function_id, name, description, package_price, is_active, eligibility_criteria, registration_types) VALUES ('e7f8a9b0-c1d2-4e5f-9876-543210fedcba', 'eebddef5-6833-43e3-8d32-700508b1c089', 'Ladies Brunch, Ceremony & Banquet', 'Ladies Brunch, Grand Proclamation Ceremony and Banquet Package for Guests', '185.00', 't', '{"rules": [{"type": "attendee_type", "value": "guest", "operator": "equals"}]}', '{individuals}') ON 
  CONFLICT (package_id) DO NOTHING;
INSERT INTO packages (package_id, function_id, name, description, package_price, is_active, eligibility_criteria, registration_types) VALUES ('794841e4-5f04-4899-96e2-c0afece4d5f2', 'eebddef5-6833-43e3-8d32-700508b1c089', 'Lodge Package', 'Package for Lodges - 10 tickets for Banquet', '1150.00', 't', '{"rules": [{"type": "registration_type", "value": "lodges", "operator": "equals"}]}', '{lodges}') ON 
  CONFLICT (package_id) DO NOTHING;

  COMMIT;