-- Database sync triggers to maintain consistency between JSONB and normalized masonic data
-- Implements bidirectional sync between attendees.masonic_status and masonic_profiles table

-- Function to sync masonic_profiles changes back to attendees.masonic_status
CREATE OR REPLACE FUNCTION sync_attendee_masonic_status()
RETURNS TRIGGER AS $$
DECLARE
    v_attendee_record RECORD;
    v_updated_masonic_status JSONB;
BEGIN
    -- This function runs when masonic_profiles table is updated
    -- It updates the corresponding attendees.masonic_status JSONB field
    
    -- Find attendees linked to this contact
    FOR v_attendee_record IN 
        SELECT attendee_id, masonic_status 
        FROM attendees 
        WHERE contact_id = COALESCE(NEW.contact_id, OLD.contact_id)
        AND attendee_type = 'mason'
    LOOP
        -- Build updated masonic_status JSONB from normalized data
        v_updated_masonic_status := COALESCE(v_attendee_record.masonic_status, '{}'::jsonb);
        
        IF TG_OP = 'DELETE' THEN
            -- Remove normalized fields from JSONB when masonic_profile is deleted
            v_updated_masonic_status := v_updated_masonic_status - 'masonic_title' - 'rank' - 'grand_rank' - 'grand_officer' - 'grand_office';
        ELSE
            -- Update JSONB with current normalized data
            v_updated_masonic_status := v_updated_masonic_status || jsonb_build_object(
                'masonic_title', NEW.masonic_title,
                'rank', NEW.rank,
                'grand_rank', NEW.grand_rank,
                'grand_officer', NEW.grand_officer,
                'grand_office', NEW.grand_office,
                'normalized_profile_id', NEW.masonic_profile_id,
                'normalized_sync_timestamp', CURRENT_TIMESTAMP
            );
        END IF;
        
        -- Update the attendee's masonic_status
        UPDATE attendees 
        SET masonic_status = v_updated_masonic_status,
            updated_at = CURRENT_TIMESTAMP
        WHERE attendee_id = v_attendee_record.attendee_id;
        
        RAISE NOTICE 'Synced masonic_status for attendee %', v_attendee_record.attendee_id;
    END LOOP;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to sync attendees.masonic_status changes to masonic_profiles
CREATE OR REPLACE FUNCTION sync_masonic_profiles_from_attendee()
RETURNS TRIGGER AS $$
DECLARE
    v_masonic_data JSONB;
    v_contact_id UUID;
    v_existing_profile_id UUID;
BEGIN
    -- This function runs when attendees.masonic_status is updated
    -- It updates the corresponding masonic_profiles record
    
    -- Only process mason attendees with contact_id
    IF NEW.attendee_type != 'mason' OR NEW.contact_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    v_contact_id := NEW.contact_id;
    v_masonic_data := NEW.masonic_status;
    
    -- Skip if no masonic_status data
    IF v_masonic_data IS NULL OR v_masonic_data = '{}'::jsonb THEN
        RETURN NEW;
    END IF;
    
    -- Check if masonic_profile already exists for this contact
    SELECT masonic_profile_id INTO v_existing_profile_id
    FROM masonic_profiles
    WHERE contact_id = v_contact_id;
    
    IF v_existing_profile_id IS NOT NULL THEN
        -- Update existing masonic_profile
        UPDATE masonic_profiles SET
            masonic_title = COALESCE(v_masonic_data->>'masonic_title', v_masonic_data->>'title', masonic_title),
            rank = COALESCE(v_masonic_data->>'rank', rank),
            grand_rank = COALESCE(v_masonic_data->>'grand_rank', grand_rank),
            grand_officer = COALESCE(v_masonic_data->>'grand_officer', v_masonic_data->>'grandOfficerStatus', grand_officer),
            grand_office = COALESCE(v_masonic_data->>'grand_office', v_masonic_data->>'presentGrandOfficerRole', grand_office),
            lodge_id = CASE 
                WHEN v_masonic_data->>'lodge_id' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                THEN (v_masonic_data->>'lodge_id')::uuid
                ELSE lodge_id
            END,
            grand_lodge_id = CASE 
                WHEN v_masonic_data->>'grand_lodge_id' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                THEN (v_masonic_data->>'grand_lodge_id')::uuid
                ELSE grand_lodge_id
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE masonic_profile_id = v_existing_profile_id;
        
        RAISE NOTICE 'Updated masonic_profile % from attendee %', v_existing_profile_id, NEW.attendee_id;
    ELSE
        -- Create new masonic_profile if we have minimum required data
        IF v_masonic_data->>'rank' IS NOT NULL AND 
           (v_masonic_data->>'lodge_id' IS NOT NULL OR v_masonic_data->>'grand_lodge_id' IS NOT NULL) THEN
            
            INSERT INTO masonic_profiles (
                masonic_profile_id,
                contact_id,
                masonic_title,
                rank,
                grand_rank,
                grand_officer,
                grand_office,
                lodge_id,
                grand_lodge_id,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                v_contact_id,
                COALESCE(v_masonic_data->>'masonic_title', v_masonic_data->>'title'),
                v_masonic_data->>'rank',
                v_masonic_data->>'grand_rank',
                COALESCE(v_masonic_data->>'grand_officer', v_masonic_data->>'grandOfficerStatus'),
                COALESCE(v_masonic_data->>'grand_office', v_masonic_data->>'presentGrandOfficerRole'),
                CASE 
                    WHEN v_masonic_data->>'lodge_id' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                    THEN (v_masonic_data->>'lodge_id')::uuid
                    ELSE NULL
                END,
                CASE 
                    WHEN v_masonic_data->>'grand_lodge_id' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                    THEN (v_masonic_data->>'grand_lodge_id')::uuid
                    ELSE NULL
                END,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );
            
            RAISE NOTICE 'Created masonic_profile for attendee % contact %', NEW.attendee_id, v_contact_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for bidirectional sync

-- Trigger on masonic_profiles table changes
DROP TRIGGER IF EXISTS trigger_sync_attendee_masonic_status ON masonic_profiles;
CREATE TRIGGER trigger_sync_attendee_masonic_status
    AFTER INSERT OR UPDATE OR DELETE ON masonic_profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_attendee_masonic_status();

-- Trigger on attendees.masonic_status changes
DROP TRIGGER IF EXISTS trigger_sync_masonic_profiles_from_attendee ON attendees;
CREATE TRIGGER trigger_sync_masonic_profiles_from_attendee
    AFTER INSERT OR UPDATE OF masonic_status ON attendees
    FOR EACH ROW
    WHEN (NEW.attendee_type = 'mason' AND NEW.contact_id IS NOT NULL)
    EXECUTE FUNCTION sync_masonic_profiles_from_attendee();

-- Add helpful comments
COMMENT ON FUNCTION sync_attendee_masonic_status() IS 'Syncs changes from masonic_profiles table back to attendees.masonic_status JSONB field';
COMMENT ON FUNCTION sync_masonic_profiles_from_attendee() IS 'Syncs changes from attendees.masonic_status JSONB to normalized masonic_profiles table';

-- Create validation function for masonic profile data consistency
CREATE OR REPLACE FUNCTION validate_masonic_profile_consistency(
    p_contact_id UUID DEFAULT NULL,
    p_attendee_id UUID DEFAULT NULL
) RETURNS TABLE (
    contact_id UUID,
    attendee_id UUID,
    has_masonic_profile BOOLEAN,
    has_masonic_status BOOLEAN,
    rank_matches BOOLEAN,
    title_matches BOOLEAN,
    consistency_score INTEGER,
    issues TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    WITH profile_data AS (
        SELECT 
            c.contact_id,
            a.attendee_id,
            mp.masonic_profile_id IS NOT NULL as has_profile,
            a.masonic_status IS NOT NULL AND a.masonic_status != '{}'::jsonb as has_status,
            mp.rank as profile_rank,
            mp.masonic_title as profile_title,
            a.masonic_status->>'rank' as status_rank,
            COALESCE(a.masonic_status->>'masonic_title', a.masonic_status->>'title') as status_title
        FROM contacts c
        LEFT JOIN attendees a ON a.contact_id = c.contact_id AND a.attendee_type = 'mason'
        LEFT JOIN masonic_profiles mp ON mp.contact_id = c.contact_id
        WHERE 
            (p_contact_id IS NULL OR c.contact_id = p_contact_id)
            AND (p_attendee_id IS NULL OR a.attendee_id = p_attendee_id)
            AND a.attendee_id IS NOT NULL  -- Only include contacts with mason attendees
    )
    SELECT 
        pd.contact_id,
        pd.attendee_id,
        pd.has_profile,
        pd.has_status,
        COALESCE(pd.profile_rank = pd.status_rank, FALSE) as rank_matches,
        COALESCE(pd.profile_title = pd.status_title, FALSE) as title_matches,
        (
            CASE WHEN pd.has_profile AND pd.has_status THEN 2 ELSE 0 END +
            CASE WHEN COALESCE(pd.profile_rank = pd.status_rank, FALSE) THEN 1 ELSE 0 END +
            CASE WHEN COALESCE(pd.profile_title = pd.status_title, FALSE) THEN 1 ELSE 0 END
        ) as consistency_score,
        ARRAY_REMOVE(ARRAY[
            CASE WHEN NOT pd.has_profile AND pd.has_status THEN 'Missing masonic_profile record' END,
            CASE WHEN pd.has_profile AND NOT pd.has_status THEN 'Missing masonic_status JSONB data' END,
            CASE WHEN pd.has_profile AND pd.has_status AND pd.profile_rank != pd.status_rank THEN 'Rank mismatch between profile and status' END,
            CASE WHEN pd.has_profile AND pd.has_status AND pd.profile_title != pd.status_title THEN 'Title mismatch between profile and status' END
        ], NULL) as issues
    FROM profile_data pd;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_masonic_profile_consistency(UUID, UUID) IS 'Validates consistency between masonic_profiles and attendees.masonic_status data';

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION sync_attendee_masonic_status() TO authenticated;
GRANT EXECUTE ON FUNCTION sync_masonic_profiles_from_attendee() TO authenticated;
GRANT EXECUTE ON FUNCTION validate_masonic_profile_consistency(UUID, UUID) TO authenticated;