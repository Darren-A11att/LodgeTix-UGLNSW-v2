-- Diagnostic queries to understand data discrepancies between tables

-- 1. Find registration IDs that exist in each table
WITH registration_ids AS (
    SELECT 
        'registrations' as source_table,
        registration_id,
        created_at,
        customer_id,
        event_id,
        status
    FROM registrations
    UNION ALL
    SELECT 
        'Registrations' as source_table,
        registration_id,
        created_at,
        customer_id,
        event_id,
        status
    FROM "Registrations"
)
SELECT 
    registration_id,
    string_agg(DISTINCT source_table, ', ' ORDER BY source_table) as exists_in_tables,
    COUNT(DISTINCT source_table) as table_count,
    MAX(created_at) as latest_created_at,
    string_agg(DISTINCT status, ', ') as statuses
FROM registration_ids
GROUP BY registration_id
ORDER BY table_count DESC, latest_created_at DESC;

-- 2. Find orphaned attendees (reference registrations that don't exist)
SELECT 
    a.attendeeid,
    a.registrationid,
    a.attendeetype,
    a.firstname,
    a.lastname,
    a.createdat,
    CASE 
        WHEN r1.registration_id IS NOT NULL THEN 'exists in registrations'
        WHEN r2.registration_id IS NOT NULL THEN 'exists in Registrations'
        ELSE 'ORPHANED - no registration found'
    END as registration_status
FROM attendees a
LEFT JOIN registrations r1 ON a.registrationid = r1.registration_id
LEFT JOIN "Registrations" r2 ON a.registrationid = r2.registration_id
WHERE a.registrationid IS NOT NULL
ORDER BY 
    CASE 
        WHEN r1.registration_id IS NULL AND r2.registration_id IS NULL THEN 0
        ELSE 1
    END,
    a.createdat DESC;

-- 3. Count summary
SELECT 
    'Total registrations in lowercase table' as metric,
    COUNT(*) as count
FROM registrations
UNION ALL
SELECT 
    'Total registrations in PascalCase table',
    COUNT(*)
FROM "Registrations"
UNION ALL
SELECT 
    'Registrations only in lowercase',
    COUNT(*)
FROM registrations r1
WHERE NOT EXISTS (
    SELECT 1 FROM "Registrations" r2 
    WHERE r2.registration_id = r1.registration_id
)
UNION ALL
SELECT 
    'Registrations only in PascalCase',
    COUNT(*)
FROM "Registrations" r1
WHERE NOT EXISTS (
    SELECT 1 FROM registrations r2 
    WHERE r2.registration_id = r1.registration_id
)
UNION ALL
SELECT 
    'Registrations in both tables',
    COUNT(DISTINCT r1.registration_id)
FROM registrations r1
INNER JOIN "Registrations" r2 ON r1.registration_id = r2.registration_id
UNION ALL
SELECT 
    'Attendees with orphaned registration references',
    COUNT(*)
FROM attendees a
WHERE a.registrationid IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM registrations r WHERE r.registration_id = a.registrationid
    )
    AND NOT EXISTS (
        SELECT 1 FROM "Registrations" r WHERE r.registration_id = a.registrationid
    );

-- 4. Show the specific orphaned registration IDs
SELECT DISTINCT
    a.registrationid as orphaned_registration_id,
    COUNT(*) as attendee_count
FROM attendees a
WHERE a.registrationid IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM registrations r WHERE r.registration_id = a.registrationid
    )
    AND NOT EXISTS (
        SELECT 1 FROM "Registrations" r WHERE r.registration_id = a.registrationid
    )
GROUP BY a.registrationid;

-- 5. Check which table has the registration that the error mentions
SELECT 
    '4f7acc42-df0d-4dbb-ae45-33999dad6592' as registration_id,
    EXISTS(SELECT 1 FROM registrations WHERE registration_id = '4f7acc42-df0d-4dbb-ae45-33999dad6592') as in_lowercase,
    EXISTS(SELECT 1 FROM "Registrations" WHERE registration_id = '4f7acc42-df0d-4dbb-ae45-33999dad6592') as in_uppercase;