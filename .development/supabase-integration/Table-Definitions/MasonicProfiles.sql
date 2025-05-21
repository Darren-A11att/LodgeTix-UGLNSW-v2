create table public."MasonicProfiles" (
  masonicprofileid uuid not null default gen_random_uuid (),
  masonictitle character varying(50) null,
  rank character varying(50) null,
  grandrank character varying(50) null,
  grandofficer character varying(50) null,
  grandoffice character varying(100) null,
  lodgeid uuid null,
  createdat timestamp with time zone not null default timezone ('utc'::text, now()),
  updatedat timestamp with time zone not null default timezone ('utc'::text, now()),
  person_id uuid null,
  constraint masonicprofiles_pkey primary key (masonicprofileid),
  constraint masonicprofiles_person_id_unique unique (person_id),
  constraint fk_masonicprofiles_organisation_link foreign KEY (lodgeid) references organisations (organisationid) on delete set null,
  constraint masonicprofiles_person_id_fkey foreign KEY (person_id) references people (person_id)
) TABLESPACE pg_default;