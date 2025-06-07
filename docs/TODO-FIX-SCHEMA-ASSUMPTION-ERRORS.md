# TODO: Fix Schema Assumption Errors

## Immediate Fix (Contact Preference Error)
- [ ] Update migration to use `attendee_contact_preference` instead of `contact_preference_type`
- [ ] Fix enum value casting to handle case conversion properly
- [ ] Test registration flow to ensure it completes without errors

## Audit for Similar Issues
- [ ] Search for all enum type casts in SQL migrations
- [ ] Verify each enum type name matches actual database schema
- [ ] Check for hardcoded enum values that might not match database
- [ ] Look for missing LOWER() conversions on enum casts

## Validation Improvements
- [ ] Add pre-validation for enum values before database operations
- [ ] Create centralized enum definitions file
- [ ] Add tests for enum value validation
- [ ] Improve error messages for enum-related failures

## Documentation
- [ ] Document all database enum types and their values
- [ ] Create mapping between frontend values and database enums
- [ ] Add comments in migrations explaining enum usage
- [ ] Update developer documentation with enum guidelines

## Specific Files to Review
- [ ] All RPC functions in migrations
- [ ] API route handlers that insert/update data
- [ ] Frontend forms that send enum values
- [ ] Type definitions that reference enums