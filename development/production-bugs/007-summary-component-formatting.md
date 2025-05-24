# Summary Component Formatting Issues

## Issue Description
The summary components throughout the registration wizard have formatting issues that create confusion and poor readability. Specifically, the Attendee Details Summary displays information in a confusing format with double-barrel descriptions and lacks proper table structure.

## Current Issues

### 1. Double-Barrel Descriptions
Attendee entries show confusing combinations like:
- "Mason - Primary Guest Partner"
- Multiple descriptors strung together without clear hierarchy
- Unclear what each label represents

### 2. Poor List Structure
Current format appears as a single column list with mixed information:
```
John Smith
Mason - Primary Guest Partner
Jane Doe
Guest - Partner
```

## Expected Behavior

### Attendee List Format
Should display as a clean 2-column table:

| Name | Type/Role |
|------|-----------|
| John Smith | Mason (Primary) |
| Jane Doe | Partner of John Smith |
| Robert Johnson | Guest |
| Sarah Johnson | Partner of Robert Johnson |

### Clear Information Hierarchy
- Primary information (name) in first column
- Role/type information in second column
- Relationship information clearly indicated
- No confusing compound labels

## Impact
- **User Confusion**: Difficult to understand attendee relationships and roles
- **Professional Appearance**: Current format looks unpolished
- **Data Clarity**: Important distinctions between attendee types are obscured
- **Review Accuracy**: Users may miss errors due to poor formatting

## Affected Components
- Attendee Details Summary component
- Summary list rendering logic
- Summary data formatting utilities
- Possibly other summary sections with similar issues

## Additional Formatting Needs
- Consistent spacing between entries
- Clear visual separation between attendees
- Proper alignment of information
- Mobile-responsive table layout

## Priority
Medium-High - Affects user ability to review and confirm registration details

## Suggested Implementation
1. Convert attendee list to proper table structure
2. Implement clear column headers
3. Separate role/type information from relationship data
4. Use consistent terminology (avoid mixing "Primary", "Guest", "Partner")
5. Add visual indicators for relationships (indentation or connectors)
6. Ensure responsive design for mobile views

## Technical Considerations
- May require refactoring summary data structure
- Need to maintain accessibility with proper table markup
- Consider using CSS Grid or responsive table patterns
- Ensure print-friendly formatting