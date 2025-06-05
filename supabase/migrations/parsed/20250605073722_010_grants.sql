-- GRANTS from remote schema

-- Permission grants

GRANT USAGE ON SCHEMA "public" TO "postgres";

GRANT USAGE ON SCHEMA "public" TO "anon";

GRANT USAGE ON SCHEMA "public" TO "authenticated";

GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON FUNCTION "public"."calculate_event_pricing"("p_event_ids" "uuid"[]) TO "anon";

GRANT ALL ON FUNCTION "public"."calculate_event_pricing"("p_event_ids" "uuid"[]) TO "authenticated";

GRANT ALL ON FUNCTION "public"."calculate_event_pricing"("p_event_ids" "uuid"[]) TO "service_role";

GRANT ALL ON FUNCTION "public"."check_ticket_availability"("p_event_id" "uuid") TO "anon";

GRANT ALL ON FUNCTION "public"."check_ticket_availability"("p_event_id" "uuid") TO "authenticated";

GRANT ALL ON FUNCTION "public"."check_ticket_availability"("p_event_id" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."check_ticket_eligibility"("p_attendee_type" "text", "p_rank" "text", "p_grand_rank" "text", "p_grand_officer" boolean, "p_lodge_id" "uuid", "p_grand_lodge_id" "uuid", "p_registration_type" "text", "p_eligibility_rules" "jsonb") TO "anon";

GRANT ALL ON FUNCTION "public"."check_ticket_eligibility"("p_attendee_type" "text", "p_rank" "text", "p_grand_rank" "text", "p_grand_officer" boolean, "p_lodge_id" "uuid", "p_grand_lodge_id" "uuid", "p_registration_type" "text", "p_eligibility_rules" "jsonb") TO "authenticated";

GRANT ALL ON FUNCTION "public"."check_ticket_eligibility"("p_attendee_type" "text", "p_rank" "text", "p_grand_rank" "text", "p_grand_officer" boolean, "p_lodge_id" "uuid", "p_grand_lodge_id" "uuid", "p_registration_type" "text", "p_eligibility_rules" "jsonb") TO "service_role";

GRANT ALL ON FUNCTION "public"."cleanup_expired_reservations"() TO "anon";

GRANT ALL ON FUNCTION "public"."cleanup_expired_reservations"() TO "authenticated";

GRANT ALL ON FUNCTION "public"."cleanup_expired_reservations"() TO "service_role";

GRANT ALL ON FUNCTION "public"."complete_payment"("p_registration_id" "uuid", "p_payment_intent_id" "text") TO "anon";

GRANT ALL ON FUNCTION "public"."complete_payment"("p_registration_id" "uuid", "p_payment_intent_id" "text") TO "authenticated";

GRANT ALL ON FUNCTION "public"."complete_payment"("p_registration_id" "uuid", "p_payment_intent_id" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."create_contact_for_new_user"() TO "anon";

GRANT ALL ON FUNCTION "public"."create_contact_for_new_user"() TO "authenticated";

GRANT ALL ON FUNCTION "public"."create_contact_for_new_user"() TO "service_role";

GRANT ALL ON FUNCTION "public"."create_registration_with_attendees"("p_registration_data" "json") TO "anon";

GRANT ALL ON FUNCTION "public"."create_registration_with_attendees"("p_registration_data" "json") TO "authenticated";

GRANT ALL ON FUNCTION "public"."create_registration_with_attendees"("p_registration_data" "json") TO "service_role";

GRANT ALL ON FUNCTION "public"."expire_ticket_reservations"() TO "anon";

GRANT ALL ON FUNCTION "public"."expire_ticket_reservations"() TO "authenticated";

GRANT ALL ON FUNCTION "public"."expire_ticket_reservations"() TO "service_role";

GRANT ALL ON FUNCTION "public"."find_missing_indexes"() TO "anon";

GRANT ALL ON FUNCTION "public"."find_missing_indexes"() TO "authenticated";

GRANT ALL ON FUNCTION "public"."find_missing_indexes"() TO "service_role";

GRANT ALL ON FUNCTION "public"."generate_uuid_type"() TO "anon";

GRANT ALL ON FUNCTION "public"."generate_uuid_type"() TO "authenticated";

GRANT ALL ON FUNCTION "public"."generate_uuid_type"() TO "service_role";

GRANT ALL ON FUNCTION "public"."get_eligible_tickets"("p_event_id" "uuid", "p_registration_id" "uuid") TO "anon";

GRANT ALL ON FUNCTION "public"."get_eligible_tickets"("p_event_id" "uuid", "p_registration_id" "uuid") TO "authenticated";

GRANT ALL ON FUNCTION "public"."get_eligible_tickets"("p_event_id" "uuid", "p_registration_id" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."get_event_with_details"("p_event_slug" "text") TO "anon";

GRANT ALL ON FUNCTION "public"."get_event_with_details"("p_event_slug" "text") TO "authenticated";

GRANT ALL ON FUNCTION "public"."get_event_with_details"("p_event_slug" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."get_function_details"("p_function_id" "uuid") TO "anon";

GRANT ALL ON FUNCTION "public"."get_function_details"("p_function_id" "uuid") TO "authenticated";

GRANT ALL ON FUNCTION "public"."get_function_details"("p_function_id" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."get_function_details_formatted"("p_function_id" "uuid") TO "anon";

GRANT ALL ON FUNCTION "public"."get_function_details_formatted"("p_function_id" "uuid") TO "authenticated";

GRANT ALL ON FUNCTION "public"."get_function_details_formatted"("p_function_id" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."get_registration_summary"("p_registration_id" "uuid") TO "anon";

GRANT ALL ON FUNCTION "public"."get_registration_summary"("p_registration_id" "uuid") TO "authenticated";

GRANT ALL ON FUNCTION "public"."get_registration_summary"("p_registration_id" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."inherit_parent_organiser_id"() TO "anon";

GRANT ALL ON FUNCTION "public"."inherit_parent_organiser_id"() TO "authenticated";

GRANT ALL ON FUNCTION "public"."inherit_parent_organiser_id"() TO "service_role";

GRANT ALL ON FUNCTION "public"."initialize_event_ticket_availability"() TO "anon";

GRANT ALL ON FUNCTION "public"."initialize_event_ticket_availability"() TO "authenticated";

GRANT ALL ON FUNCTION "public"."initialize_event_ticket_availability"() TO "service_role";

GRANT ALL ON FUNCTION "public"."monitor_index_usage"() TO "anon";

GRANT ALL ON FUNCTION "public"."monitor_index_usage"() TO "authenticated";

GRANT ALL ON FUNCTION "public"."monitor_index_usage"() TO "service_role";

GRANT ALL ON FUNCTION "public"."recalculate_event_counts"() TO "anon";

GRANT ALL ON FUNCTION "public"."recalculate_event_counts"() TO "authenticated";

GRANT ALL ON FUNCTION "public"."recalculate_event_counts"() TO "service_role";

GRANT ALL ON FUNCTION "public"."recalculate_event_ticket_counts"() TO "anon";

GRANT ALL ON FUNCTION "public"."recalculate_event_ticket_counts"() TO "authenticated";

GRANT ALL ON FUNCTION "public"."recalculate_event_ticket_counts"() TO "service_role";

GRANT ALL ON FUNCTION "public"."reserve_tickets"("p_ticket_selections" "json") TO "anon";

GRANT ALL ON FUNCTION "public"."reserve_tickets"("p_ticket_selections" "json") TO "authenticated";

GRANT ALL ON FUNCTION "public"."reserve_tickets"("p_ticket_selections" "json") TO "service_role";

GRANT ALL ON FUNCTION "public"."should_generate_confirmation"() TO "anon";

GRANT ALL ON FUNCTION "public"."should_generate_confirmation"() TO "authenticated";

GRANT ALL ON FUNCTION "public"."should_generate_confirmation"() TO "service_role";

GRANT ALL ON FUNCTION "public"."update_event_counts"() TO "anon";

GRANT ALL ON FUNCTION "public"."update_event_counts"() TO "authenticated";

GRANT ALL ON FUNCTION "public"."update_event_counts"() TO "service_role";

GRANT ALL ON FUNCTION "public"."update_event_ticket_counts"() TO "anon";

GRANT ALL ON FUNCTION "public"."update_event_ticket_counts"() TO "authenticated";

GRANT ALL ON FUNCTION "public"."update_event_ticket_counts"() TO "service_role";

GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";

GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";

GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";

GRANT ALL ON FUNCTION "public"."upsert_individual_registration"("p_registration_data" "jsonb") TO "anon";

GRANT ALL ON FUNCTION "public"."upsert_individual_registration"("p_registration_data" "jsonb") TO "authenticated";

GRANT ALL ON FUNCTION "public"."upsert_individual_registration"("p_registration_data" "jsonb") TO "service_role";

GRANT ALL ON FUNCTION "public"."upsert_lodge_registration"("p_function_id" "uuid", "p_package_id" "uuid", "p_table_count" integer, "p_booking_contact" "jsonb", "p_lodge_details" "jsonb", "p_payment_status" "text", "p_stripe_payment_intent_id" "text", "p_registration_id" "uuid", "p_total_amount" numeric, "p_subtotal" numeric, "p_stripe_fee" numeric, "p_metadata" "jsonb") TO "anon";

GRANT ALL ON FUNCTION "public"."upsert_lodge_registration"("p_function_id" "uuid", "p_package_id" "uuid", "p_table_count" integer, "p_booking_contact" "jsonb", "p_lodge_details" "jsonb", "p_payment_status" "text", "p_stripe_payment_intent_id" "text", "p_registration_id" "uuid", "p_total_amount" numeric, "p_subtotal" numeric, "p_stripe_fee" numeric, "p_metadata" "jsonb") TO "authenticated";

GRANT ALL ON FUNCTION "public"."upsert_lodge_registration"("p_function_id" "uuid", "p_package_id" "uuid", "p_table_count" integer, "p_booking_contact" "jsonb", "p_lodge_details" "jsonb", "p_payment_status" "text", "p_stripe_payment_intent_id" "text", "p_registration_id" "uuid", "p_total_amount" numeric, "p_subtotal" numeric, "p_stripe_fee" numeric, "p_metadata" "jsonb") TO "service_role";

GRANT ALL ON TABLE "public"."attendee_events" TO "anon";

GRANT ALL ON TABLE "public"."attendee_events" TO "authenticated";

GRANT ALL ON TABLE "public"."attendee_events" TO "service_role";

GRANT ALL ON TABLE "public"."attendees" TO "anon";

GRANT ALL ON TABLE "public"."attendees" TO "authenticated";

GRANT ALL ON TABLE "public"."attendees" TO "service_role";

GRANT ALL ON TABLE "public"."customers" TO "anon";

GRANT ALL ON TABLE "public"."customers" TO "authenticated";

GRANT ALL ON TABLE "public"."customers" TO "service_role";

GRANT ALL ON TABLE "public"."auth_user_customer_view" TO "anon";

GRANT ALL ON TABLE "public"."auth_user_customer_view" TO "authenticated";

GRANT ALL ON TABLE "public"."auth_user_customer_view" TO "service_role";

GRANT ALL ON TABLE "public"."connected_account_payments" TO "anon";

GRANT ALL ON TABLE "public"."connected_account_payments" TO "authenticated";

GRANT ALL ON TABLE "public"."connected_account_payments" TO "service_role";

GRANT ALL ON TABLE "public"."contacts" TO "anon";

GRANT ALL ON TABLE "public"."contacts" TO "authenticated";

GRANT ALL ON TABLE "public"."contacts" TO "service_role";

GRANT ALL ON TABLE "public"."functions" TO "anon";

GRANT ALL ON TABLE "public"."functions" TO "authenticated";

GRANT ALL ON TABLE "public"."functions" TO "service_role";

GRANT ALL ON TABLE "public"."locations" TO "anon";

GRANT ALL ON TABLE "public"."locations" TO "authenticated";

GRANT ALL ON TABLE "public"."locations" TO "service_role";

GRANT ALL ON TABLE "public"."registrations" TO "anon";

GRANT ALL ON TABLE "public"."registrations" TO "authenticated";

GRANT ALL ON TABLE "public"."registrations" TO "service_role";

GRANT ALL ON TABLE "public"."registration_confirmation_base_view" TO "anon";

GRANT ALL ON TABLE "public"."registration_confirmation_base_view" TO "authenticated";

GRANT ALL ON TABLE "public"."registration_confirmation_base_view" TO "service_role";

GRANT ALL ON TABLE "public"."tickets" TO "anon";

GRANT ALL ON TABLE "public"."tickets" TO "authenticated";

GRANT ALL ON TABLE "public"."tickets" TO "service_role";

GRANT ALL ON TABLE "public"."delegation_registration_confirmation_view" TO "anon";

GRANT ALL ON TABLE "public"."delegation_registration_confirmation_view" TO "authenticated";

GRANT ALL ON TABLE "public"."delegation_registration_confirmation_view" TO "service_role";

GRANT ALL ON TABLE "public"."display_scopes" TO "anon";

GRANT ALL ON TABLE "public"."display_scopes" TO "authenticated";

GRANT ALL ON TABLE "public"."display_scopes" TO "service_role";

GRANT ALL ON TABLE "public"."eligibility_criteria" TO "anon";

GRANT ALL ON TABLE "public"."eligibility_criteria" TO "authenticated";

GRANT ALL ON TABLE "public"."eligibility_criteria" TO "service_role";

GRANT ALL ON TABLE "public"."event_tickets" TO "anon";

GRANT ALL ON TABLE "public"."event_tickets" TO "authenticated";

GRANT ALL ON TABLE "public"."event_tickets" TO "service_role";

GRANT ALL ON TABLE "public"."event_tickets_with_id" TO "anon";

GRANT ALL ON TABLE "public"."event_tickets_with_id" TO "authenticated";

GRANT ALL ON TABLE "public"."event_tickets_with_id" TO "service_role";

GRANT ALL ON TABLE "public"."events" TO "anon";

GRANT ALL ON TABLE "public"."events" TO "authenticated";

GRANT ALL ON TABLE "public"."events" TO "service_role";

GRANT ALL ON TABLE "public"."events_with_id" TO "anon";

GRANT ALL ON TABLE "public"."events_with_id" TO "authenticated";

GRANT ALL ON TABLE "public"."events_with_id" TO "service_role";

GRANT ALL ON TABLE "public"."function_event_tickets_view" TO "anon";

GRANT ALL ON TABLE "public"."function_event_tickets_view" TO "authenticated";

GRANT ALL ON TABLE "public"."function_event_tickets_view" TO "service_role";

GRANT ALL ON TABLE "public"."packages" TO "anon";

GRANT ALL ON TABLE "public"."packages" TO "authenticated";

GRANT ALL ON TABLE "public"."packages" TO "service_role";

GRANT ALL ON TABLE "public"."function_packages_view" TO "anon";

GRANT ALL ON TABLE "public"."function_packages_view" TO "authenticated";

GRANT ALL ON TABLE "public"."function_packages_view" TO "service_role";

GRANT ALL ON TABLE "public"."grand_lodges" TO "anon";

GRANT ALL ON TABLE "public"."grand_lodges" TO "authenticated";

GRANT ALL ON TABLE "public"."grand_lodges" TO "service_role";

GRANT ALL ON TABLE "public"."individuals_registration_confirmation_view" TO "anon";

GRANT ALL ON TABLE "public"."individuals_registration_confirmation_view" TO "authenticated";

GRANT ALL ON TABLE "public"."individuals_registration_confirmation_view" TO "service_role";

GRANT ALL ON TABLE "public"."lodge_registration_confirmation_view" TO "anon";

GRANT ALL ON TABLE "public"."lodge_registration_confirmation_view" TO "authenticated";

GRANT ALL ON TABLE "public"."lodge_registration_confirmation_view" TO "service_role";

GRANT ALL ON TABLE "public"."lodges" TO "anon";

GRANT ALL ON TABLE "public"."lodges" TO "authenticated";

GRANT ALL ON TABLE "public"."lodges" TO "service_role";

GRANT ALL ON TABLE "public"."masonic_profiles" TO "anon";

GRANT ALL ON TABLE "public"."masonic_profiles" TO "authenticated";

GRANT ALL ON TABLE "public"."masonic_profiles" TO "service_role";

GRANT ALL ON TABLE "public"."memberships" TO "anon";

GRANT ALL ON TABLE "public"."memberships" TO "authenticated";

GRANT ALL ON TABLE "public"."memberships" TO "service_role";

GRANT ALL ON TABLE "public"."organisations" TO "anon";

GRANT ALL ON TABLE "public"."organisations" TO "authenticated";

GRANT ALL ON TABLE "public"."organisations" TO "service_role";

GRANT ALL ON TABLE "public"."memberships_view" TO "anon";

GRANT ALL ON TABLE "public"."memberships_view" TO "authenticated";

GRANT ALL ON TABLE "public"."memberships_view" TO "service_role";

GRANT ALL ON TABLE "public"."organisation_payouts" TO "anon";

GRANT ALL ON TABLE "public"."organisation_payouts" TO "authenticated";

GRANT ALL ON TABLE "public"."organisation_payouts" TO "service_role";

GRANT ALL ON TABLE "public"."organisation_users" TO "anon";

GRANT ALL ON TABLE "public"."organisation_users" TO "authenticated";

GRANT ALL ON TABLE "public"."organisation_users" TO "service_role";

GRANT ALL ON TABLE "public"."platform_transfers" TO "anon";

GRANT ALL ON TABLE "public"."platform_transfers" TO "authenticated";

GRANT ALL ON TABLE "public"."platform_transfers" TO "service_role";

GRANT ALL ON TABLE "public"."raw_payloads" TO "anon";

GRANT ALL ON TABLE "public"."raw_payloads" TO "authenticated";

GRANT ALL ON TABLE "public"."raw_payloads" TO "service_role";

GRANT ALL ON TABLE "public"."raw_registrations" TO "anon";

GRANT ALL ON TABLE "public"."raw_registrations" TO "authenticated";

GRANT ALL ON TABLE "public"."raw_registrations" TO "service_role";

GRANT ALL ON TABLE "public"."ticket_availability_view" TO "anon";

GRANT ALL ON TABLE "public"."ticket_availability_view" TO "authenticated";

GRANT ALL ON TABLE "public"."ticket_availability_view" TO "service_role";

GRANT ALL ON TABLE "public"."tickets_with_id" TO "anon";

GRANT ALL ON TABLE "public"."tickets_with_id" TO "authenticated";

GRANT ALL ON TABLE "public"."tickets_with_id" TO "service_role";

GRANT ALL ON TABLE "public"."user_roles" TO "anon";

GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";

GRANT ALL ON TABLE "public"."user_roles" TO "service_role";

GRANT ALL ON TABLE "public"."webhook_logs" TO "anon";

GRANT ALL ON TABLE "public"."webhook_logs" TO "authenticated";

GRANT ALL ON TABLE "public"."webhook_logs" TO "service_role";
