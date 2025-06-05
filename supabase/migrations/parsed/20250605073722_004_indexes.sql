-- INDEXES from remote schema

-- Performance indexes

CREATE INDEX "idx_attendee_events_attendee_id" ON "public"."attendee_events" USING "btree" ("attendee_id");

CREATE INDEX "idx_attendee_events_event_id" ON "public"."attendee_events" USING "btree" ("event_id");

CREATE INDEX "idx_attendees_auth_user_id" ON "public"."attendees" USING "btree" ("auth_user_id");

CREATE INDEX "idx_attendees_contact" ON "public"."attendees" USING "btree" ("contact_id") WHERE ("contact_id" IS NOT NULL);

CREATE INDEX "idx_attendees_contact_id" ON "public"."attendees" USING "btree" ("contact_id");

CREATE INDEX "idx_attendees_event_title" ON "public"."attendees" USING "btree" ("event_title");

CREATE INDEX "idx_attendees_is_primary" ON "public"."attendees" USING "btree" ("is_primary") WHERE ("is_primary" = true);

CREATE INDEX "idx_attendees_qr_code_url" ON "public"."attendees" USING "btree" ("qr_code_url") WHERE ("qr_code_url" IS NOT NULL);

CREATE INDEX "idx_attendees_registration" ON "public"."attendees" USING "btree" ("registration_id");

CREATE INDEX "idx_attendees_registration_id" ON "public"."attendees" USING "btree" ("registration_id");

CREATE INDEX "idx_attendees_registration_primary" ON "public"."attendees" USING "btree" ("registration_id", "is_primary") WHERE ("is_primary" = true);

CREATE INDEX "idx_attendees_related" ON "public"."attendees" USING "btree" ("related_attendee_id") WHERE ("related_attendee_id" IS NOT NULL);

CREATE INDEX "idx_attendees_related_attendee_id" ON "public"."attendees" USING "btree" ("related_attendee_id");

CREATE INDEX "idx_connected_payments_account" ON "public"."connected_account_payments" USING "btree" ("connected_account_id");

CREATE INDEX "idx_connected_payments_registration" ON "public"."connected_account_payments" USING "btree" ("registration_id");

CREATE INDEX "idx_contacts_auth_user" ON "public"."contacts" USING "btree" ("auth_user_id") WHERE ("auth_user_id" IS NOT NULL);

CREATE INDEX "idx_contacts_auth_user_id" ON "public"."contacts" USING "btree" ("auth_user_id");

CREATE INDEX "idx_contacts_email" ON "public"."contacts" USING "btree" ("email");

CREATE INDEX "idx_contacts_email_lower" ON "public"."contacts" USING "btree" ("lower"("email"));

CREATE INDEX "idx_contacts_organisation_id" ON "public"."contacts" USING "btree" ("organisation_id");

CREATE INDEX "idx_contacts_source" ON "public"."contacts" USING "btree" ("source_type", "source_id");

CREATE INDEX "idx_customers_contact_id" ON "public"."customers" USING "btree" ("contact_id");

CREATE INDEX "idx_customers_created_at" ON "public"."customers" USING "btree" ("created_at");

CREATE INDEX "idx_customers_customer_type" ON "public"."customers" USING "btree" ("customer_type");

CREATE INDEX "idx_customers_email" ON "public"."customers" USING "btree" ("email");

CREATE INDEX "idx_customers_phone" ON "public"."customers" USING "btree" ("phone");

CREATE INDEX "idx_customers_stripe_id" ON "public"."customers" USING "btree" ("stripe_customer_id");

CREATE INDEX "idx_event_tickets_active" ON "public"."event_tickets" USING "btree" ("event_id", "is_active") WHERE ("is_active" = true);

CREATE INDEX "idx_event_tickets_active_available" ON "public"."event_tickets" USING "btree" ("event_id", "available_count") WHERE (("is_active" = true) AND (("status")::"text" = 'Active'::"text") AND ("available_count" > 0));

CREATE INDEX "idx_event_tickets_eligibility_criteria" ON "public"."event_tickets" USING "gin" ("eligibility_criteria");

CREATE INDEX "idx_event_tickets_event_active" ON "public"."event_tickets" USING "btree" ("event_id", "is_active", "status");

CREATE INDEX "idx_event_tickets_event_id" ON "public"."event_tickets" USING "btree" ("event_id");

CREATE INDEX "idx_event_tickets_stripe_price_id" ON "public"."event_tickets" USING "btree" ("stripe_price_id") WHERE ("stripe_price_id" IS NOT NULL);

CREATE INDEX "idx_events_capacity" ON "public"."events" USING "btree" ("reserved_count", "sold_count") WHERE (("reserved_count" > 0) OR ("sold_count" > 0));

CREATE INDEX "idx_events_date_range" ON "public"."events" USING "btree" ("event_start", "event_end") WHERE ("is_published" = true);

CREATE INDEX "idx_events_display_scope_id" ON "public"."events" USING "btree" ("display_scope_id");

CREATE INDEX "idx_events_featured_published" ON "public"."events" USING "btree" ("featured", "is_published", "event_start" DESC) WHERE ("featured" = true);

CREATE INDEX "idx_events_function" ON "public"."events" USING "btree" ("function_id");

CREATE INDEX "idx_events_location_id" ON "public"."events" USING "btree" ("location_id");

CREATE INDEX "idx_events_location_org" ON "public"."events" USING "btree" ("event_id", "location_id", "organiser_id");

CREATE INDEX "idx_events_organiser" ON "public"."events" USING "btree" ("organiser_id", "event_start" DESC) WHERE ("is_published" = true);

CREATE INDEX "idx_events_organiser_id" ON "public"."events" USING "btree" ("organiser_id");

CREATE INDEX "idx_events_registration_availability_id" ON "public"."events" USING "btree" ("registration_availability_id");

CREATE INDEX "idx_events_slug" ON "public"."events" USING "btree" ("slug");

CREATE INDEX "idx_events_stripe_product_id" ON "public"."events" USING "btree" ("stripe_product_id") WHERE ("stripe_product_id" IS NOT NULL);

CREATE INDEX "idx_functions_organiser" ON "public"."functions" USING "btree" ("organiser_id");

CREATE INDEX "idx_functions_published" ON "public"."functions" USING "btree" ("is_published");

CREATE INDEX "idx_functions_slug" ON "public"."functions" USING "btree" ("slug");

CREATE INDEX "idx_grand_lodges_organisationid" ON "public"."grand_lodges" USING "btree" ("organisation_id");

CREATE INDEX "idx_lodges_grand_lodge" ON "public"."lodges" USING "btree" ("grand_lodge_id");

CREATE INDEX "idx_lodges_grand_lodge_id" ON "public"."lodges" USING "btree" ("grand_lodge_id");

CREATE INDEX "idx_lodges_organisationid" ON "public"."lodges" USING "btree" ("organisation_id");

CREATE INDEX "idx_masonic_profiles_contact" ON "public"."masonic_profiles" USING "btree" ("contact_id");

CREATE INDEX "idx_masonic_profiles_contact_id" ON "public"."masonic_profiles" USING "btree" ("contact_id");

CREATE INDEX "idx_masonic_profiles_lodge_id" ON "public"."masonic_profiles" USING "btree" ("lodge_id");

CREATE INDEX "idx_masonicprofiles_grandlodgeid" ON "public"."masonic_profiles" USING "btree" ("grand_lodge_id");

CREATE INDEX "idx_memberships_contact_active" ON "public"."memberships" USING "btree" ("contact_id", "is_active") WHERE ("is_active" = true);

CREATE INDEX "idx_memberships_contact_id" ON "public"."memberships" USING "btree" ("contact_id");

CREATE INDEX "idx_memberships_is_active" ON "public"."memberships" USING "btree" ("is_active");

CREATE INDEX "idx_memberships_profile_id" ON "public"."memberships" USING "btree" ("profile_id");

CREATE INDEX "idx_memberships_type_entity" ON "public"."memberships" USING "btree" ("membership_type", "membership_entity_id");

CREATE INDEX "idx_organisation_payouts_created_at" ON "public"."organisation_payouts" USING "btree" ("created_at");

CREATE INDEX "idx_organisation_payouts_stripe_id" ON "public"."organisation_payouts" USING "btree" ("organisation_stripe_id");

CREATE INDEX "idx_organisation_users_organisation_id" ON "public"."organisation_users" USING "btree" ("organisation_id");

CREATE INDEX "idx_organisation_users_user_id" ON "public"."organisation_users" USING "btree" ("user_id");

CREATE INDEX "idx_packages_eligibility_criteria" ON "public"."packages" USING "gin" ("eligibility_criteria");

CREATE INDEX "idx_packages_event_id" ON "public"."packages" USING "btree" ("event_id");

CREATE INDEX "idx_packages_function" ON "public"."packages" USING "btree" ("function_id");

CREATE INDEX "idx_packages_is_active" ON "public"."packages" USING "btree" ("is_active");

CREATE INDEX "idx_platform_transfers_destination" ON "public"."platform_transfers" USING "btree" ("destination_account");

CREATE INDEX "idx_raw_registrations_created_at" ON "public"."raw_registrations" USING "btree" ("created_at");

CREATE INDEX "idx_registrations_attendee_count" ON "public"."registrations" USING "btree" ("attendee_count");

CREATE INDEX "idx_registrations_auth_user_id" ON "public"."registrations" USING "btree" ("auth_user_id");

CREATE INDEX "idx_registrations_confirmation_number" ON "public"."registrations" USING "btree" ("confirmation_number");

CREATE INDEX "idx_registrations_confirmation_type" ON "public"."registrations" USING "btree" ("confirmation_number", "registration_type") WHERE ("confirmation_number" IS NOT NULL);

CREATE INDEX "idx_registrations_created_at" ON "public"."registrations" USING "btree" ("created_at");

CREATE INDEX "idx_registrations_customer_id" ON "public"."registrations" USING "btree" ("customer_id");

CREATE INDEX "idx_registrations_function" ON "public"."registrations" USING "btree" ("function_id");

CREATE INDEX "idx_registrations_organisation_id" ON "public"."registrations" USING "btree" ("organisation_id");

CREATE INDEX "idx_registrations_organisation_name" ON "public"."registrations" USING "btree" ("organisation_name");

CREATE INDEX "idx_registrations_payment_intent" ON "public"."registrations" USING "btree" ("stripe_payment_intent_id", "payment_status") WHERE ("stripe_payment_intent_id" IS NOT NULL);

CREATE INDEX "idx_registrations_payment_status" ON "public"."registrations" USING "btree" ("payment_status");

CREATE INDEX "idx_registrations_recent" ON "public"."registrations" USING "btree" ("created_at" DESC);

CREATE INDEX "idx_registrations_stripe_intent" ON "public"."registrations" USING "btree" ("stripe_payment_intent_id") WHERE ("stripe_payment_intent_id" IS NOT NULL);

CREATE INDEX "idx_registrations_type_status" ON "public"."registrations" USING "btree" ("registration_type", "status");

CREATE INDEX "idx_tickets_attendee" ON "public"."tickets" USING "btree" ("attendee_id") WHERE ("attendee_id" IS NOT NULL);

CREATE INDEX "idx_tickets_attendee_id" ON "public"."tickets" USING "btree" ("attendee_id");

CREATE INDEX "idx_tickets_event_id" ON "public"."tickets" USING "btree" ("event_id");

CREATE INDEX "idx_tickets_package_id" ON "public"."tickets" USING "btree" ("package_id");

CREATE INDEX "idx_tickets_qr_code_url" ON "public"."tickets" USING "btree" ("qr_code_url") WHERE ("qr_code_url" IS NOT NULL);

CREATE INDEX "idx_tickets_registration_id" ON "public"."tickets" USING "btree" ("registration_id");

CREATE INDEX "idx_tickets_registration_paid" ON "public"."tickets" USING "btree" ("registration_id") WHERE (("status")::"text" = 'sold'::"text");

CREATE INDEX "idx_tickets_registration_price" ON "public"."tickets" USING "btree" ("registration_id", "price_paid");

CREATE INDEX "idx_tickets_registration_status" ON "public"."tickets" USING "btree" ("registration_id", "status");

CREATE INDEX "idx_tickets_reservation" ON "public"."tickets" USING "btree" ("reservation_id", "reservation_expires_at") WHERE ("reservation_id" IS NOT NULL);

CREATE INDEX "idx_tickets_reservation_expiry" ON "public"."tickets" USING "btree" ("reservation_expires_at") WHERE (("status")::"text" = 'reserved'::"text");

CREATE INDEX "idx_tickets_reservation_status" ON "public"."tickets" USING "btree" ("ticket_type_id", "reservation_id", "reservation_expires_at", "status") WHERE ("reservation_id" IS NOT NULL);

CREATE INDEX "idx_tickets_status" ON "public"."tickets" USING "btree" ("status");

CREATE INDEX "idx_tickets_status_event" ON "public"."tickets" USING "btree" ("status", "event_id");

CREATE INDEX "idx_tickets_ticket_type_id" ON "public"."tickets" USING "btree" ("ticket_type_id");

CREATE INDEX "idx_tickets_type_event" ON "public"."tickets" USING "btree" ("ticket_type_id", "event_id");

CREATE INDEX "idx_webhook_logs_created_at" ON "public"."webhook_logs" USING "btree" ("created_at" DESC);

CREATE INDEX "idx_webhook_logs_webhook_name" ON "public"."webhook_logs" USING "btree" ("webhook_name");
