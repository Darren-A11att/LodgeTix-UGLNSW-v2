-- Remote database schema
-- This migration loads all components of the remote schema in the correct order

-- Load each component
\i parsed/20250605073722_001_extensions.sql
\i parsed/20250605073722_002_types.sql
\i parsed/20250605073722_003_tables.sql
\i parsed/20250605073722_004_indexes.sql
\i parsed/20250605073722_005_constraints.sql
\i parsed/20250605073722_006_views.sql
\i parsed/20250605073722_007_functions.sql
\i parsed/20250605073722_008_triggers.sql
\i parsed/20250605073722_009_policies.sql
\i parsed/20250605073722_010_grants.sql
