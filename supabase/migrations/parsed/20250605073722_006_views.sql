-- VIEWS from remote schema

-- Database views

CREATE OR REPLACE VIEW "public"."auth_user_customer_view" WITH ("security_invoker"='on') AS
 SELECT "au"."id" AS "auth_user_id",
    "au"."email" AS "auth_email",
    "c"."customer_id",
    "c"."organisation_id",
    "c"."first_name",
    "c"."last_name",
    "c"."business_name",
    "c"."email" AS "customer_email",
    "c"."phone",
    "c"."billing_organisation_name",
    "c"."billing_email",
    "c"."billing_phone",
    "c"."billing_street_address",
    "c"."billing_city",
    "c"."billing_state",
    "c"."billing_postal_code",
    "c"."billing_country",
    "c"."address_line1",
    "c"."address_line2",
    "c"."city",
    "c"."state",
    "c"."postal_code",
    "c"."country",
    "c"."stripe_customer_id",
    "c"."created_at",
    "c"."updated_at",
    "c"."contact_id",
    "c"."customer_type"
   FROM ("auth"."users" "au"
     LEFT JOIN "public"."customers" "c" ON (("c"."customer_id" = "au"."id")));

CREATE OR REPLACE VIEW "public"."registration_confirmation_base_view" AS
 SELECT "r"."registration_id",
    "r"."confirmation_number",
    "r"."customer_id",
    "r"."auth_user_id",
    "r"."function_id",
    "r"."registration_type",
    "r"."payment_status",
    "r"."status",
    "r"."total_amount_paid",
    "r"."subtotal",
    "r"."stripe_fee",
    "r"."stripe_payment_intent_id",
    "r"."registration_data",
    "r"."created_at" AS "registration_created_at",
    "r"."updated_at" AS "registration_updated_at",
    "f"."name" AS "function_name",
    "f"."slug" AS "function_slug",
    "f"."description" AS "function_description",
    "f"."image_url" AS "function_image_url",
    "f"."start_date" AS "function_start_date",
    "f"."end_date" AS "function_end_date",
    "f"."location_id" AS "function_location_id",
    "f"."organiser_id" AS "function_organiser_id",
    "f"."metadata" AS "function_metadata",
    "f"."is_published" AS "function_is_published",
    "f"."created_at" AS "function_created_at",
    "f"."updated_at" AS "function_updated_at",
    "f"."function_events",
    "fl"."place_name" AS "function_location_name",
    "fl"."street_address" AS "function_location_address",
    "fl"."suburb" AS "function_location_city",
    "fl"."state" AS "function_location_state",
    "fl"."country" AS "function_location_country",
    "fl"."postal_code" AS "function_location_postal_code",
    "fl"."latitude" AS "function_location_latitude",
    "fl"."longitude" AS "function_location_longitude",
    "c"."first_name" AS "customer_first_name",
    "c"."last_name" AS "customer_last_name",
    "c"."email" AS "customer_email",
    "c"."phone" AS "customer_phone",
    (("r"."registration_data" -> 'billingDetails'::"text") ->> 'firstName'::"text") AS "billing_first_name",
    (("r"."registration_data" -> 'billingDetails'::"text") ->> 'lastName'::"text") AS "billing_last_name",
    (("r"."registration_data" -> 'billingDetails'::"text") ->> 'emailAddress'::"text") AS "billing_email",
    (("r"."registration_data" -> 'billingDetails'::"text") ->> 'mobileNumber'::"text") AS "billing_phone",
    (("r"."registration_data" -> 'billingDetails'::"text") ->> 'addressLine1'::"text") AS "billing_street_address",
    (("r"."registration_data" -> 'billingDetails'::"text") ->> 'suburb'::"text") AS "billing_city",
    ((("r"."registration_data" -> 'billingDetails'::"text") -> 'stateTerritory'::"text") ->> 'name'::"text") AS "billing_state",
    (("r"."registration_data" -> 'billingDetails'::"text") ->> 'postcode'::"text") AS "billing_postal_code",
    ((("r"."registration_data" -> 'billingDetails'::"text") -> 'country'::"text") ->> 'name'::"text") AS "billing_country"
   FROM ((("public"."registrations" "r"
     LEFT JOIN "public"."functions" "f" ON (("r"."function_id" = "f"."function_id")))
     LEFT JOIN "public"."locations" "fl" ON (("f"."location_id" = "fl"."location_id")))
     LEFT JOIN "public"."customers" "c" ON (("r"."customer_id" = "c"."customer_id")))
  WHERE (("r"."confirmation_number" IS NOT NULL) AND (("r"."payment_status" = 'completed'::"public"."payment_status") OR (("r"."status")::"text" = 'completed'::"text")));

CREATE OR REPLACE VIEW "public"."delegation_registration_confirmation_view" AS
 SELECT "b"."registration_id",
    "b"."confirmation_number",
    "b"."customer_id",
    "b"."auth_user_id",
    "b"."function_id",
    "b"."registration_type",
    "b"."payment_status",
    "b"."status",
    "b"."total_amount_paid",
    "b"."subtotal",
    "b"."stripe_fee",
    "b"."stripe_payment_intent_id",
    "b"."registration_data",
    "b"."registration_created_at",
    "b"."registration_updated_at",
    "b"."function_name",
    "b"."function_slug",
    "b"."function_description",
    "b"."function_image_url",
    "b"."function_start_date",
    "b"."function_end_date",
    "b"."function_location_id",
    "b"."function_organiser_id",
    "b"."function_metadata",
    "b"."function_is_published",
    "b"."function_created_at",
    "b"."function_updated_at",
    "b"."function_events",
    "b"."function_location_name",
    "b"."function_location_address",
    "b"."function_location_city",
    "b"."function_location_state",
    "b"."function_location_country",
    "b"."function_location_postal_code",
    "b"."function_location_latitude",
    "b"."function_location_longitude",
    "b"."customer_first_name",
    "b"."customer_last_name",
    "b"."customer_email",
    "b"."customer_phone",
    "b"."billing_first_name",
    "b"."billing_last_name",
    "b"."billing_email",
    "b"."billing_phone",
    "b"."billing_street_address",
    "b"."billing_city",
    "b"."billing_state",
    "b"."billing_postal_code",
    "b"."billing_country",
    ("b"."registration_data" ->> 'delegationName'::"text") AS "delegation_name",
    ("b"."registration_data" ->> 'delegationType'::"text") AS "delegation_type",
    ("b"."registration_data" ->> 'leadDelegateId'::"text") AS "lead_delegate_id",
    COALESCE("jsonb_agg"(DISTINCT "jsonb_build_object"('attendeeId', "a"."attendee_id", 'isPrimary', "a"."is_primary", 'attendeeType', "a"."attendee_type", 'firstName', "a"."first_name", 'lastName', "a"."last_name", 'title', "a"."title", 'suffix', "a"."suffix", 'dietaryRequirements', "a"."dietary_requirements", 'specialNeeds', "a"."special_needs", 'contactPreference', "a"."contact_preference", 'primaryEmail', "a"."email", 'primaryPhone', "a"."phone", 'delegateRole',
        CASE
            WHEN (("a"."attendee_id")::"text" = ("b"."registration_data" ->> 'leadDelegateId'::"text")) THEN 'Lead Delegate'::"text"
            ELSE 'Delegate'::"text"
        END)) FILTER (WHERE ("a"."attendee_id" IS NOT NULL)), '[]'::"jsonb") AS "delegation_members",
    "count"(DISTINCT "a"."attendee_id") AS "total_delegates",
    COALESCE("jsonb_agg"(DISTINCT "jsonb_build_object"('ticketId', "t"."ticket_id", 'attendeeId', "t"."attendee_id", 'ticketStatus', "t"."ticket_status", 'ticketPrice', "t"."ticket_price")) FILTER (WHERE ("t"."ticket_id" IS NOT NULL)), '[]'::"jsonb") AS "tickets",
    "count"(DISTINCT "t"."ticket_id") AS "total_tickets"
   FROM (("public"."registration_confirmation_base_view" "b"
     LEFT JOIN "public"."attendees" "a" ON (("b"."registration_id" = "a"."registration_id")))
     LEFT JOIN "public"."tickets" "t" ON (("b"."registration_id" = "t"."registration_id")))
  WHERE ("b"."registration_type" = 'delegation'::"public"."registration_type")
  GROUP BY "b"."registration_id", "b"."confirmation_number", "b"."customer_id", "b"."auth_user_id", "b"."function_id", "b"."registration_type", "b"."payment_status", "b"."status", "b"."total_amount_paid", "b"."subtotal", "b"."stripe_fee", "b"."stripe_payment_intent_id", "b"."registration_data", "b"."registration_created_at", "b"."registration_updated_at", "b"."function_name", "b"."function_slug", "b"."function_description", "b"."function_image_url", "b"."function_start_date", "b"."function_end_date", "b"."function_location_id", "b"."function_organiser_id", "b"."function_metadata", "b"."function_is_published", "b"."function_created_at", "b"."function_updated_at", "b"."function_events", "b"."function_location_name", "b"."function_location_address", "b"."function_location_city", "b"."function_location_state", "b"."function_location_country", "b"."function_location_postal_code", "b"."function_location_latitude", "b"."function_location_longitude", "b"."customer_first_name", "b"."customer_last_name", "b"."customer_email", "b"."customer_phone", "b"."billing_first_name", "b"."billing_last_name", "b"."billing_email", "b"."billing_phone", "b"."billing_street_address", "b"."billing_city", "b"."billing_state", "b"."billing_postal_code", "b"."billing_country";

CREATE OR REPLACE VIEW "public"."event_tickets_with_id" WITH ("security_invoker"='on') AS
 SELECT "event_tickets"."event_ticket_id",
    "event_tickets"."event_ticket_id" AS "id",
    "event_tickets"."event_id",
    "event_tickets"."name",
    "event_tickets"."description",
    "event_tickets"."price",
    "event_tickets"."total_capacity",
    "event_tickets"."available_count",
    "event_tickets"."reserved_count",
    "event_tickets"."sold_count",
    "event_tickets"."status",
    "event_tickets"."is_active",
    "event_tickets"."created_at",
    "event_tickets"."updated_at",
    "event_tickets"."eligibility_criteria",
    "event_tickets"."stripe_price_id"
   FROM "public"."event_tickets";

CREATE OR REPLACE VIEW "public"."events_with_id" WITH ("security_invoker"='on') AS
 SELECT "events"."event_id",
    "events"."event_id" AS "id",
    "events"."attendance",
    "events"."created_at",
    "events"."degree_type",
    "events"."description",
    "events"."display_scope_id",
    "events"."documents",
    "events"."dress_code",
    "events"."event_end",
    "events"."event_includes",
    "events"."event_start",
    "events"."featured",
    "events"."function_id",
    "events"."image_url",
    "events"."important_information",
    "events"."is_multi_day",
    "events"."is_published",
    "events"."is_purchasable_individually",
    "events"."location_id",
    "events"."max_attendees",
    "events"."organiser_id",
    "events"."regalia",
    "events"."regalia_description",
    "events"."registration_availability_id",
    "events"."related_events",
    "events"."reserved_count",
    "events"."sections",
    "events"."slug",
    "events"."sold_count",
    "events"."stripe_product_id",
    "events"."subtitle",
    "events"."title",
    "events"."type"
   FROM "public"."events";

CREATE OR REPLACE VIEW "public"."function_event_tickets_view" WITH ("security_invoker"='on') AS
 SELECT "f"."function_id",
    "f"."name" AS "function_name",
    "f"."slug" AS "function_slug",
    "f"."description" AS "function_description",
    "f"."start_date" AS "function_start_date",
    "f"."end_date" AS "function_end_date",
    "e"."event_id",
    "e"."title" AS "event_title",
    "e"."slug" AS "event_slug",
    "e"."event_start",
    "e"."event_end",
    "e"."type" AS "event_type",
    "e"."is_published" AS "event_is_published",
    "et"."event_ticket_id",
    "et"."name" AS "ticket_name",
    "et"."description" AS "ticket_description",
    "et"."price" AS "ticket_price",
    "et"."total_capacity",
    "et"."available_count",
    "et"."reserved_count",
    "et"."sold_count",
    "et"."status" AS "ticket_status",
    "et"."is_active" AS "ticket_is_active",
    "et"."eligibility_criteria" AS "ticket_eligibility_criteria",
    "et"."stripe_price_id",
    "et"."created_at" AS "ticket_created_at",
    "et"."updated_at" AS "ticket_updated_at"
   FROM (("public"."functions" "f"
     JOIN "public"."events" "e" ON (("f"."function_id" = "e"."function_id")))
     JOIN "public"."event_tickets" "et" ON (("e"."event_id" = "et"."event_id")))
  WHERE (("e"."is_published" = true) AND ("et"."is_active" = true));

CREATE OR REPLACE VIEW "public"."function_packages_view" WITH ("security_invoker"='on') AS
 SELECT "f"."function_id",
    "f"."name" AS "function_name",
    "f"."slug" AS "function_slug",
    "f"."description" AS "function_description",
    "f"."start_date" AS "function_start_date",
    "f"."end_date" AS "function_end_date",
    "p"."package_id",
    "p"."name" AS "package_name",
    "p"."description" AS "package_description",
    "p"."original_price",
    "p"."discount",
    "p"."package_price",
    "p"."is_active",
    "p"."includes_description",
    "p"."qty",
    "p"."included_items",
    "p"."eligibility_criteria",
    "p"."registration_types",
    "p"."created_at" AS "package_created_at",
    "p"."updated_at" AS "package_updated_at",
    "p"."event_id"
   FROM ("public"."functions" "f"
     JOIN "public"."packages" "p" ON (("f"."function_id" = "p"."function_id")))
  WHERE ("p"."is_active" = true);

CREATE OR REPLACE VIEW "public"."individuals_registration_confirmation_view" AS
 SELECT "b"."registration_id",
    "b"."confirmation_number",
    "b"."customer_id",
    "b"."auth_user_id",
    "b"."function_id",
    "b"."registration_type",
    "b"."payment_status",
    "b"."status",
    "b"."total_amount_paid",
    "b"."subtotal",
    "b"."stripe_fee",
    "b"."stripe_payment_intent_id",
    "b"."registration_data",
    "b"."registration_created_at",
    "b"."registration_updated_at",
    "b"."function_name",
    "b"."function_slug",
    "b"."function_description",
    "b"."function_image_url",
    "b"."function_start_date",
    "b"."function_end_date",
    "b"."function_location_id",
    "b"."function_organiser_id",
    "b"."function_metadata",
    "b"."function_is_published",
    "b"."function_created_at",
    "b"."function_updated_at",
    "b"."function_events",
    "b"."function_location_name",
    "b"."function_location_address",
    "b"."function_location_city",
    "b"."function_location_state",
    "b"."function_location_country",
    "b"."function_location_postal_code",
    "b"."function_location_latitude",
    "b"."function_location_longitude",
    "b"."customer_first_name",
    "b"."customer_last_name",
    "b"."customer_email",
    "b"."customer_phone",
    "b"."billing_first_name",
    "b"."billing_last_name",
    "b"."billing_email",
    "b"."billing_phone",
    "b"."billing_street_address",
    "b"."billing_city",
    "b"."billing_state",
    "b"."billing_postal_code",
    "b"."billing_country",
    COALESCE("jsonb_agg"(DISTINCT "jsonb_build_object"('attendeeId', "a"."attendee_id", 'isPrimary', "a"."is_primary", 'attendeeType', "a"."attendee_type", 'firstName', "a"."first_name", 'lastName', "a"."last_name", 'title', "a"."title", 'suffix', "a"."suffix", 'dietaryRequirements', "a"."dietary_requirements", 'specialNeeds', "a"."special_needs", 'contactPreference', "a"."contact_preference", 'primaryEmail', "a"."email", 'primaryPhone', "a"."phone", 'relatedAttendeeId', "a"."related_attendee_id")) FILTER (WHERE ("a"."attendee_id" IS NOT NULL)), '[]'::"jsonb") AS "attendees",
    "count"(DISTINCT "a"."attendee_id") AS "total_attendees",
    COALESCE("jsonb_agg"(DISTINCT "jsonb_build_object"('ticketId', "t"."ticket_id", 'attendeeId', "t"."attendee_id", 'ticketStatus', "t"."ticket_status", 'ticketPrice', "t"."ticket_price")) FILTER (WHERE ("t"."ticket_id" IS NOT NULL)), '[]'::"jsonb") AS "tickets",
    "count"(DISTINCT "t"."ticket_id") AS "total_tickets"
   FROM (("public"."registration_confirmation_base_view" "b"
     LEFT JOIN "public"."attendees" "a" ON (("b"."registration_id" = "a"."registration_id")))
     LEFT JOIN "public"."tickets" "t" ON (("b"."registration_id" = "t"."registration_id")))
  WHERE ("b"."registration_type" = 'individuals'::"public"."registration_type")
  GROUP BY "b"."registration_id", "b"."confirmation_number", "b"."customer_id", "b"."auth_user_id", "b"."function_id", "b"."registration_type", "b"."payment_status", "b"."status", "b"."total_amount_paid", "b"."subtotal", "b"."stripe_fee", "b"."stripe_payment_intent_id", "b"."registration_data", "b"."registration_created_at", "b"."registration_updated_at", "b"."function_name", "b"."function_slug", "b"."function_description", "b"."function_image_url", "b"."function_start_date", "b"."function_end_date", "b"."function_location_id", "b"."function_organiser_id", "b"."function_metadata", "b"."function_is_published", "b"."function_created_at", "b"."function_updated_at", "b"."function_events", "b"."function_location_name", "b"."function_location_address", "b"."function_location_city", "b"."function_location_state", "b"."function_location_country", "b"."function_location_postal_code", "b"."function_location_latitude", "b"."function_location_longitude", "b"."customer_first_name", "b"."customer_last_name", "b"."customer_email", "b"."customer_phone", "b"."billing_first_name", "b"."billing_last_name", "b"."billing_email", "b"."billing_phone", "b"."billing_street_address", "b"."billing_city", "b"."billing_state", "b"."billing_postal_code", "b"."billing_country";

CREATE OR REPLACE VIEW "public"."lodge_registration_confirmation_view" AS
 SELECT "b"."registration_id",
    "b"."confirmation_number",
    "b"."customer_id",
    "b"."auth_user_id",
    "b"."function_id",
    "b"."registration_type",
    "b"."payment_status",
    "b"."status",
    "b"."total_amount_paid",
    "b"."subtotal",
    "b"."stripe_fee",
    "b"."stripe_payment_intent_id",
    "b"."registration_data",
    "b"."registration_created_at",
    "b"."registration_updated_at",
    "b"."function_name",
    "b"."function_slug",
    "b"."function_description",
    "b"."function_image_url",
    "b"."function_start_date",
    "b"."function_end_date",
    "b"."function_location_id",
    "b"."function_organiser_id",
    "b"."function_metadata",
    "b"."function_is_published",
    "b"."function_created_at",
    "b"."function_updated_at",
    "b"."function_events",
    "b"."function_location_name",
    "b"."function_location_address",
    "b"."function_location_city",
    "b"."function_location_state",
    "b"."function_location_country",
    "b"."function_location_postal_code",
    "b"."function_location_latitude",
    "b"."function_location_longitude",
    "b"."customer_first_name",
    "b"."customer_last_name",
    "b"."customer_email",
    "b"."customer_phone",
    "b"."billing_first_name",
    "b"."billing_last_name",
    "b"."billing_email",
    "b"."billing_phone",
    "b"."billing_street_address",
    "b"."billing_city",
    "b"."billing_state",
    "b"."billing_postal_code",
    "b"."billing_country",
    ("b"."registration_data" ->> 'lodgeName'::"text") AS "lodge_name",
    ("b"."registration_data" ->> 'lodgeNumber'::"text") AS "lodge_number",
    ("b"."registration_data" ->> 'lodgeId'::"text") AS "lodge_id",
    ("b"."registration_data" ->> 'grandLodgeId'::"text") AS "grand_lodge_id",
    COALESCE("jsonb_agg"(DISTINCT "jsonb_build_object"('attendeeId', "a"."attendee_id", 'isPrimary', "a"."is_primary", 'attendeeType', "a"."attendee_type", 'firstName', "a"."first_name", 'lastName', "a"."last_name", 'title', "a"."title", 'suffix', "a"."suffix", 'dietaryRequirements', "a"."dietary_requirements", 'specialNeeds', "a"."special_needs", 'contactPreference', "a"."contact_preference", 'primaryEmail', "a"."email", 'primaryPhone', "a"."phone")) FILTER (WHERE ("a"."attendee_id" IS NOT NULL)), '[]'::"jsonb") AS "lodge_members",
    "count"(DISTINCT "a"."attendee_id") AS "total_members",
    '[]'::"jsonb" AS "member_tickets",
    COALESCE("jsonb_agg"(DISTINCT "jsonb_build_object"('ticketId', "t"."ticket_id", 'attendeeId', "t"."attendee_id", 'packageId', "t"."package_id", 'ticketStatus', "t"."ticket_status", 'ticketPrice', "t"."ticket_price", 'packageName', "p"."name", 'packageDescription', "p"."description")) FILTER (WHERE ("t"."ticket_id" IS NOT NULL)), '[]'::"jsonb") AS "tickets",
    "count"(DISTINCT "t"."ticket_id") AS "total_tickets",
    COALESCE("jsonb_agg"(DISTINCT "jsonb_build_object"('packageId', "p"."package_id", 'packageName', "p"."name", 'packagePrice', "p"."package_price", 'packageDescription', "p"."description", 'ticketCount', ( SELECT "count"(*) AS "count"
           FROM "public"."tickets" "t2"
          WHERE (("t2"."package_id" = "p"."package_id") AND ("t2"."registration_id" = "b"."registration_id"))))) FILTER (WHERE ("p"."package_id" IS NOT NULL)), '[]'::"jsonb") AS "packages"
   FROM ((("public"."registration_confirmation_base_view" "b"
     LEFT JOIN "public"."attendees" "a" ON (("b"."registration_id" = "a"."registration_id")))
     LEFT JOIN "public"."tickets" "t" ON (("b"."registration_id" = "t"."registration_id")))
     LEFT JOIN "public"."packages" "p" ON (("t"."package_id" = "p"."package_id")))
  WHERE ("b"."registration_type" = 'lodge'::"public"."registration_type")
  GROUP BY "b"."registration_id", "b"."confirmation_number", "b"."customer_id", "b"."auth_user_id", "b"."function_id", "b"."registration_type", "b"."payment_status", "b"."status", "b"."total_amount_paid", "b"."subtotal", "b"."stripe_fee", "b"."stripe_payment_intent_id", "b"."registration_data", "b"."registration_created_at", "b"."registration_updated_at", "b"."function_name", "b"."function_slug", "b"."function_description", "b"."function_image_url", "b"."function_start_date", "b"."function_end_date", "b"."function_location_id", "b"."function_organiser_id", "b"."function_metadata", "b"."function_is_published", "b"."function_created_at", "b"."function_updated_at", "b"."function_events", "b"."function_location_name", "b"."function_location_address", "b"."function_location_city", "b"."function_location_state", "b"."function_location_country", "b"."function_location_postal_code", "b"."function_location_latitude", "b"."function_location_longitude", "b"."customer_first_name", "b"."customer_last_name", "b"."customer_email", "b"."customer_phone", "b"."billing_first_name", "b"."billing_last_name", "b"."billing_email", "b"."billing_phone", "b"."billing_street_address", "b"."billing_city", "b"."billing_state", "b"."billing_postal_code", "b"."billing_country";

CREATE OR REPLACE VIEW "public"."memberships_view" AS
 SELECT "m"."membership_id",
    "m"."contact_id",
    "c"."first_name",
    "c"."last_name",
    "c"."email",
    "m"."profile_id",
    "mp"."masonic_title",
    "m"."role",
    "m"."permissions",
    "m"."membership_type",
    "m"."membership_entity_id",
        CASE
            WHEN (("m"."membership_type")::"text" = 'lodge'::"text") THEN "l"."name"
            WHEN (("m"."membership_type")::"text" = 'grand_lodge'::"text") THEN "gl"."name"
            WHEN (("m"."membership_type")::"text" = 'organisation'::"text") THEN ("o"."name")::"text"
            ELSE 'Unknown'::"text"
        END AS "entity_name",
    "m"."is_active",
    "m"."created_at"
   FROM ((((("public"."memberships" "m"
     JOIN "public"."contacts" "c" ON (("m"."contact_id" = "c"."contact_id")))
     LEFT JOIN "public"."masonic_profiles" "mp" ON (("m"."profile_id" = "mp"."masonic_profile_id")))
     LEFT JOIN "public"."lodges" "l" ON (((("m"."membership_type")::"text" = 'lodge'::"text") AND ("m"."membership_entity_id" = "l"."lodge_id"))))
     LEFT JOIN "public"."grand_lodges" "gl" ON (((("m"."membership_type")::"text" = 'grand_lodge'::"text") AND ("m"."membership_entity_id" = "gl"."grand_lodge_id"))))
     LEFT JOIN "public"."organisations" "o" ON (((("m"."membership_type")::"text" = 'organisation'::"text") AND ("m"."membership_entity_id" = "o"."organisation_id"))));

CREATE OR REPLACE VIEW "public"."ticket_availability_view" WITH ("security_invoker"='on') AS
 SELECT "et"."event_ticket_id" AS "ticket_type_id",
    "et"."event_id",
    "et"."name" AS "ticket_type_name",
    "et"."description",
    "et"."price",
    "et"."total_capacity",
    "et"."available_count",
    "et"."reserved_count",
    "et"."sold_count",
    "et"."status",
    "et"."is_active",
    "et"."eligibility_criteria",
    "et"."created_at",
    "et"."updated_at",
    "e"."title" AS "event_title",
    "e"."slug" AS "event_slug",
    "e"."event_start",
    "e"."event_end",
    "e"."is_published" AS "event_is_published",
        CASE
            WHEN (("et"."total_capacity" IS NULL) OR ("et"."total_capacity" = 0)) THEN (0)::numeric
            ELSE "round"(((("et"."sold_count")::numeric / ("et"."total_capacity")::numeric) * (100)::numeric), 2)
        END AS "percentage_sold",
        CASE
            WHEN (("et"."available_count" IS NULL) OR ("et"."available_count" = 0)) THEN true
            ELSE false
        END AS "is_sold_out",
    ( SELECT "count"(*) AS "count"
           FROM "public"."tickets" "t"
          WHERE (("t"."ticket_type_id" = "et"."event_ticket_id") AND ("t"."reservation_id" IS NOT NULL) AND ("t"."reservation_expires_at" > "now"()) AND (("t"."status")::"text" = 'reserved'::"text"))) AS "active_reservations",
        CASE
            WHEN ("et"."available_count" IS NULL) THEN (0)::bigint
            ELSE GREATEST((0)::bigint, ("et"."available_count" - ( SELECT "count"(*) AS "count"
               FROM "public"."tickets" "t"
              WHERE (("t"."ticket_type_id" = "et"."event_ticket_id") AND ("t"."reservation_id" IS NOT NULL) AND ("t"."reservation_expires_at" > "now"()) AND (("t"."status")::"text" = 'reserved'::"text")))))
        END AS "actual_available",
    ("et"."eligibility_criteria" ->> 'category'::"text") AS "ticket_category",
    ("et"."eligibility_criteria" -> 'rules'::"text") AS "eligibility_rules",
        CASE
            WHEN ("jsonb_array_length"(("et"."eligibility_criteria" -> 'rules'::"text")) > 0) THEN true
            ELSE false
        END AS "has_eligibility_requirements"
   FROM ("public"."event_tickets" "et"
     JOIN "public"."events" "e" ON (("et"."event_id" = "e"."event_id")))
  WHERE ("et"."is_active" = true);

CREATE OR REPLACE VIEW "public"."tickets_with_id" WITH ("security_invoker"='on') AS
 SELECT "tickets"."ticket_id",
    "tickets"."ticket_id" AS "id",
    "tickets"."attendee_id",
    "tickets"."checked_in_at",
    "tickets"."created_at",
    "tickets"."currency",
    "tickets"."event_id",
    "tickets"."is_partner_ticket",
    "tickets"."original_price",
    "tickets"."package_id",
    "tickets"."payment_status",
    "tickets"."price_paid",
    "tickets"."purchased_at",
    "tickets"."qr_code_url",
    "tickets"."registration_id",
    "tickets"."reservation_expires_at",
    "tickets"."reservation_id",
    "tickets"."seat_info",
    "tickets"."status",
    "tickets"."ticket_price",
    "tickets"."ticket_status",
    "tickets"."ticket_type_id",
    "tickets"."updated_at"
   FROM "public"."tickets";
