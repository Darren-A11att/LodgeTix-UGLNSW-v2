-- REPLACED: This migration has been superseded by 20250617000000_comprehensive_confirmation_number_fix.sql
-- The comprehensive fix handles all confirmation number format inconsistencies properly

-- This migration was failing due to inconsistent confirmation number formats:
-- - Individual registrations: IND-123456 (6 digits only)
-- - Lodge registrations: LDG123456AB (no hyphen, with letters)
-- - Target format: (IND|LDG|DEL)-[0-9]{6}[A-Z]{2}

-- The comprehensive fix migration handles all these formats and converts them properly
-- It also updates all generation functions to use consistent format

DO $$
BEGIN
  RAISE NOTICE 'This migration has been replaced by 20250617000000_comprehensive_confirmation_number_fix.sql';
  RAISE NOTICE 'See the comprehensive migration for the complete fix of confirmation number formats';
END $$;