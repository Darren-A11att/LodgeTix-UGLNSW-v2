-- Fix raw_registrations table column naming to match production
-- If the primary key is named 'id', rename it to 'raw_id'

DO $$
BEGIN
    -- Check if the 'id' column exists in raw_registrations table
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'raw_registrations' 
        AND column_name = 'id'
    ) THEN
        -- Rename 'id' column to 'raw_id'
        ALTER TABLE public.raw_registrations RENAME COLUMN id TO raw_id;
        
        RAISE NOTICE 'Renamed raw_registrations.id column to raw_id';
    ELSE
        RAISE NOTICE 'Column raw_registrations.id does not exist - no action needed';
    END IF;
END $$;