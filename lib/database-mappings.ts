
// Generated field mappings for database migration
export const DATABASE_FIELD_MAPPINGS = {
  // Contact fields
  "contactId": "contact_id",
  "firstName": "first_name",
  "lastName": "last_name",
  "title": "title",
  "suffix1": "suffix_1",
  "suffix2": "suffix_2",
  "suffix3": "suffix_3",
  "contactPreference": "contact_preference",
  "mobileNumber": "mobile_number",
  "email": "email",
  "addressLine1": "address_line_1",
  "addressLine2": "address_line_2",
  "suburbCity": "suburb_city",
  "state": "state",
  "country": "country",
  "postcode": "postcode",
  "dietaryRequirements": "dietary_requirements",
  "specialNeeds": "special_needs",
  "type": "type",
  "hasPartner": "has_partner",
  "isPartner": "is_partner",
  
  // Event fields
  "eventId": "event_id",
  "eventType": "type",
  "hostOrganisationId": "host_organisation_id",
  "startDateTime": "start_date_time",
  "endDateTime": "end_date_time",
  "doorsOpen": "doors_open",
  "name": "name",
  "description": "description",
  "slug": "slug",
  "status": "status",
  "visibility": "visibility",
  "featured": "featured",
  "location": "location",
  "heroImage": "hero_image",
  "images": "images",
  "dressCode": "dress_code",
  "eligibility": "eligibility",
  "inclusions": "inclusions",
  "importantInformation": "important_information",
  "functionId": "function_id",
  "totalCapacity": "total_capacity",
  
  // Registration fields
  "registrationId": "registration_id",
  "primaryContactId": "primary_contact_id",
  "registrationType": "registration_type",
  "registrationData": "registration_data",
  "totalAmount": "total_amount",
  "paymentStatus": "payment_status",
  "stripePaymentIntentId": "stripe_payment_intent_id",
  
  // Ticket fields
  "ticketId": "ticket_id",
  "eventTicketId": "event_ticket_id",
  "serialNumber": "serial_number",
  "ticketCost": "ticket_cost",
  "amountPaid": "amount_paid",
  "amountOwing": "amount_owing",
  "discount": "discount",
  "category": "category",
  "area": "area",
  "seat": "seat",
  "qrCode": "qr_code",
  "ticketHolderId": "ticket_holder_id",
  "claimCode": "claim_code",
  
  // Event Ticket fields
  "maxTickets": "max_tickets",
  "available": "available",
  "sold": "sold",
  "price": "price",
  "eligibilityTypes": "eligibility_types",
  
  // Organisation fields
  "organisationId": "organisation_id",
  "abbreviation": "abbreviation",
  "idNumber": "id_number",
  "countryCode": "country_code",
  "stateRegion": "state_region",
  "stateRegionCode": "state_region_code",
  "businessEntityName": "business_entity_name",
  "businessEntityType": "business_entity_type",
  "businessRegistrationNumber": "business_registration_number",
  "phoneNumber": "phone_number",
  "emailAddress": "email_address",
  "website": "website",
  
  // Package fields
  "packageId": "package_id",
  "fullPrice": "full_price",
  "totalCost": "total_cost",
  
  // Common timestamp fields
  "createdAt": "created_at",
  "updatedAt": "updated_at"
};

export const DATABASE_TABLE_MAPPINGS = {
  // Actual tables in the database
  "checkIns": "check_ins",
  "contactEvents": "contact_events",
  "contacts": "contacts",
  "emailLogs": "email_logs",
  "emailQueue": "email_queue",
  "eventPackages": "event_packages",
  "eventTickets": "event_tickets",
  "events": "events",
  "invitations": "invitations",
  "organisationMembers": "organisation_members",
  "organisations": "organisations",
  "packages": "packages",
  "registrationDrafts": "registration_drafts",
  "registrations": "registrations",
  "ticketCancellations": "ticket_cancellations",
  "ticketTransfers": "ticket_transfers",
  "tickets": "tickets"
};

export const DATABASE_ENUM_MAPPINGS = {
  // Contact Type enum values
  "Mason": "mason",
  "Guest": "guest",
  
  // Event Status enum values
  "Draft": "draft",
  "Published": "published",
  "Archived": "archived",
  
  // Event Ticket Status enum values
  "Active": "active",
  "SoldOut": "sold_out",
  "Closed": "closed",
  
  // Event Type enum values
  "Function": "function",
  "Event": "event",
  
  // Organisation Type enum values
  "GrandLodge": "grand_lodge",
  "Lodge": "lodge",
  "MasonicOrder": "masonic_order",
  
  // Payment Status enum values
  "Unpaid": "unpaid",
  "Paid": "paid",
  "Complimentary": "complimentary",
  
  // Ticket Type enum values
  "Pending": "pending",
  "Reserved": "reserved",
  "Issued": "issued",
  "Invited": "invited",
  "Cancelled": "cancelled",
  "Released": "released",
  
  // Visibility Type enum values
  "Public": "public",
  "Members": "members",
  "Private": "private",
  "Invitation": "invitation"
};
