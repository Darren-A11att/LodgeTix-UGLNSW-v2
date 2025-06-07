# PRD: Venue Page Implementation

## Product Requirements Document

### 1. Problem Statement
- The venue page route `/functions/[slug]/venue` returns a 404 error
- Current database schema for locations table is incomplete 
- Missing essential location data fields required for a proper venue information page
- Current page design is basic and doesn't leverage modern UI patterns

### 2. Success Criteria
- Venue page loads successfully without 404 errors
- All venue information displays dynamically from database
- Modern, responsive design using inspired layout patterns
- Google Maps integration for location visualization
- All data sourced from database (no hardcoded content)
- Test coverage for all functionality
- Secure and robust implementation

### 3. Current State Analysis

#### Database Schema Issues
**Current locations table columns:**
- `location_id`, `room_or_area`, `place_name`, `street_address`, `suburb`, `state`, `postal_code`, `country`, `latitude`, `longitude`, `capacity`, `created_at`, `updated_at`

**Current venue page expects:**
- `id`, `name`, `address`, `suburb`, `state`, `postcode`, `country`, `phone`, `email`, `website`, `description`, `parking_info`, `public_transport_info`, `accessibility_info`

#### Critical Missing Columns
- `phone` - Contact phone number
- `email` - Contact email address  
- `website` - Venue website URL
- `description` - Venue description/overview
- `parking_info` - Parking details and instructions
- `public_transport_info` - Public transport access information
- `accessibility_info` - Accessibility features and accommodations
- Image fields for venue gallery

#### Column Name Mismatches
- `location_id` → `id` (query alias needed)
- `place_name` → `name` (query alias needed) 
- `street_address` → `address` (query alias needed)
- `postal_code` → `postcode` (query alias needed)

### 4. Proposed Solution

#### 4.1 Database Schema Enhancement
Add missing columns to locations table:
```sql
ALTER TABLE locations ADD COLUMN phone TEXT;
ALTER TABLE locations ADD COLUMN email TEXT;
ALTER TABLE locations ADD COLUMN website TEXT;
ALTER TABLE locations ADD COLUMN description TEXT;
ALTER TABLE locations ADD COLUMN parking_info TEXT;
ALTER TABLE locations ADD COLUMN public_transport_info TEXT;
ALTER TABLE locations ADD COLUMN accessibility_info TEXT;
ALTER TABLE locations ADD COLUMN image_urls JSONB DEFAULT '[]'::jsonb;
ALTER TABLE locations ADD COLUMN google_maps_embed_url TEXT;
ALTER TABLE locations ADD COLUMN google_maps_place_id TEXT;
```

#### 4.2 Page Design Implementation
**Layout Structure (based on with-image-grid inspiration):**
- Left side: Image gallery (2/3 width)
  - Hero image (large)
  - Secondary images (grid)
- Right side: Location details (1/3 width)
  - Replace product price → Location name/address
  - Replace variants → Contact information
  - Replace add to cart → Google Maps embed + "View on Google Maps" button

#### 4.3 Component Architecture
```
VenuePage
├── VenueImageGallery
├── VenueDetailsPanel
│   ├── VenueContactInfo
│   ├── VenueDescription  
│   ├── VenueAmenities
│   └── GoogleMapsSection
└── VenueAdditionalInfo
    ├── ParkingInfo
    ├── PublicTransportInfo
    └── AccessibilityInfo
```

#### 4.4 Data Flow
1. Extract slug from URL params
2. Resolve slug to functionId using existing resolver
3. Query function with location join
4. Transform data to match component expectations
5. Render with proper error handling

### 5. Technical Requirements

#### 5.1 API Route Requirements
- Use existing venue page route: `app/(public)/functions/[slug]/venue/page.tsx`
- Update query to handle column name mismatches with aliases
- Add proper error handling for missing location data
- Implement proper TypeScript types

#### 5.2 Database Query
```sql
SELECT 
  l.location_id as id,
  l.place_name as name,
  l.street_address as address,
  l.suburb,
  l.state, 
  l.postal_code as postcode,
  l.country,
  l.phone,
  l.email,
  l.website,
  l.description,
  l.parking_info,
  l.public_transport_info,
  l.accessibility_info,
  l.image_urls,
  l.google_maps_embed_url,
  l.latitude,
  l.longitude
FROM functions f
JOIN locations l ON f.location_id = l.location_id  
WHERE f.id = $1
```

#### 5.3 Google Maps Integration
- Embed Google Maps using iframe or Maps JavaScript API
- Generate Maps URL from address/coordinates
- "View on Google Maps" button linking to full maps experience
- Proper error handling if no coordinates available

#### 5.4 Image Handling
- Support multiple venue images via JSONB array
- Implement proper image gallery with responsive design
- Fallback images if none provided
- Lazy loading for performance

### 6. Testing Requirements

#### 6.1 Test-Driven Development Approach
1. **Write failing tests first**
2. **Implement minimal code to pass tests**
3. **Refactor without changing test outcomes**

#### 6.2 Test Cases Required
```typescript
// Database Tests
- Should fetch location data by function ID
- Should handle missing location gracefully
- Should return proper column aliases

// Component Tests  
- Should render venue information correctly
- Should display Google Maps when coordinates available
- Should handle missing optional fields gracefully
- Should show fallback content when location not found

// Integration Tests
- Should resolve function slug to venue page
- Should display complete venue page
- Should handle 404 for invalid slugs

// Visual Regression Tests
- Should match design specifications
- Should be responsive across devices
```

### 7. Security Requirements
- Validate all user inputs (slug parameter)
- Sanitize database outputs for XSS prevention
- Use parameterized queries for SQL injection prevention
- Implement proper CORS for maps integration
- No sensitive data exposure in client-side code

### 8. Performance Requirements
- Page load time < 2 seconds
- Images optimized and lazy loaded
- Database queries optimized with proper indexing
- Implement caching for static venue data
- Progressive enhancement for maps

### 9. Accessibility Requirements
- WCAG 2.1 AA compliance
- Proper semantic HTML structure
- Alt text for all images
- Keyboard navigation support
- Screen reader compatibility
- High contrast support

### 10. Implementation Plan

#### Phase 1: Database Schema (High Priority)
1. Create migration for missing columns
2. Update existing data if needed
3. Verify schema changes

#### Phase 2: Test Implementation (High Priority)  
1. Write comprehensive test suite
2. Ensure all tests fail initially
3. Cover edge cases and error scenarios

#### Phase 3: Core Implementation (High Priority)
1. Update venue page component
2. Implement proper data fetching
3. Make tests pass without modification

#### Phase 4: Design Implementation (Medium Priority)
1. Implement inspired design layout
2. Add Google Maps integration
3. Responsive design implementation

#### Phase 5: Enhancement & Polish (Low Priority)
1. Image gallery implementation
2. Performance optimizations
3. Accessibility improvements

### 11. Risks & Mitigation
- **Risk**: Existing location data may be incomplete
  - **Mitigation**: Implement graceful fallbacks, add data validation
- **Risk**: Google Maps API limits/costs
  - **Mitigation**: Use iframe embed, implement fallback to static maps
- **Risk**: Breaking existing functionality
  - **Mitigation**: Comprehensive testing, backward compatibility

### 12. Success Metrics
- ✅ Venue page loads without 404 error
- ✅ All database fields properly displayed
- ✅ Google Maps integration functional
- ✅ 100% test coverage achieved
- ✅ Responsive design verified
- ✅ Performance benchmarks met

### 13. Out of Scope
- Multiple venue support per function
- Venue booking/reservation functionality
- Real-time venue availability
- User reviews/ratings system
- Advanced mapping features (routes, street view)

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-07  
**Status**: Ready for Implementation