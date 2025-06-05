-- POLICIES from remote schema

-- Row Level Security policies

CREATE POLICY "Allow anonymous inserts to raw_registrations" ON "public"."raw_registrations" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);

CREATE POLICY "Allow anonymous users to insert data" ON "public"."raw_payloads" FOR INSERT TO "anon" WITH CHECK (true);

CREATE POLICY "Allow authenticated reads from raw_registrations" ON "public"."raw_registrations" FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "Anonymous users can create contacts" ON "public"."contacts" FOR INSERT TO "anon" WITH CHECK ((("auth_user_id" IS NULL) OR ("auth_user_id" = "auth"."uid"())));

CREATE POLICY "Anonymous users can create own registrations" ON "public"."registrations" FOR INSERT TO "anon" WITH CHECK ((("auth"."uid"() IS NULL) OR ("auth"."uid"() = ( SELECT "contacts"."auth_user_id"
   FROM "public"."contacts"
  WHERE ("contacts"."contact_id" = "registrations"."customer_id")))));

CREATE POLICY "Enable read access for all users" ON "public"."event_tickets" FOR SELECT USING (true);

CREATE POLICY "Organisation admins can manage memberships" ON "public"."organisation_users" USING ((EXISTS ( SELECT 1
   FROM "public"."organisation_users" "ou"
  WHERE (("ou"."user_id" = "auth"."uid"()) AND ("ou"."organisation_id" = "organisation_users"."organisation_id") AND ("ou"."role" = 'admin'::"text")))));

CREATE POLICY "Public can view all columns in packages" ON "public"."packages" FOR SELECT USING (true);

CREATE POLICY "Service role can manage webhook logs" ON "public"."webhook_logs" TO "service_role" USING (true) WITH CHECK (true);

CREATE POLICY "Users can create tickets for own registrations" ON "public"."tickets" FOR INSERT TO "authenticated", "anon" WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."registrations" "r"
     JOIN "public"."contacts" "c" ON (("c"."contact_id" = "r"."customer_id")))
  WHERE (("r"."registration_id" = "tickets"."registration_id") AND (("c"."auth_user_id" = "auth"."uid"()) OR ("c"."auth_user_id" IS NULL))))));

CREATE POLICY "Users can update own registrations" ON "public"."registrations" FOR UPDATE USING ((("auth"."uid"() = ( SELECT "contacts"."auth_user_id"
   FROM "public"."contacts"
  WHERE ("contacts"."contact_id" = "registrations"."customer_id"))) OR (( SELECT "contacts"."auth_user_id"
   FROM "public"."contacts"
  WHERE ("contacts"."contact_id" = "registrations"."customer_id")) IS NULL))) WITH CHECK ((("auth"."uid"() = ( SELECT "contacts"."auth_user_id"
   FROM "public"."contacts"
  WHERE ("contacts"."contact_id" = "registrations"."customer_id"))) OR (( SELECT "contacts"."auth_user_id"
   FROM "public"."contacts"
  WHERE ("contacts"."contact_id" = "registrations"."customer_id")) IS NULL)));

CREATE POLICY "Users can view own contacts" ON "public"."contacts" FOR SELECT USING ((("auth_user_id" = "auth"."uid"()) OR ("auth_user_id" IS NULL)));

CREATE POLICY "Users can view own registrations" ON "public"."registrations" FOR SELECT USING ((("auth"."uid"() = ( SELECT "contacts"."auth_user_id"
   FROM "public"."contacts"
  WHERE ("contacts"."contact_id" = "registrations"."customer_id"))) OR (( SELECT "contacts"."auth_user_id"
   FROM "public"."contacts"
  WHERE ("contacts"."contact_id" = "registrations"."customer_id")) IS NULL)));

CREATE POLICY "Users can view own tickets" ON "public"."tickets" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."registrations" "r"
     JOIN "public"."contacts" "c" ON (("c"."contact_id" = "r"."customer_id")))
  WHERE (("r"."registration_id" = "tickets"."registration_id") AND (("c"."auth_user_id" = "auth"."uid"()) OR ("c"."auth_user_id" IS NULL))))));

CREATE POLICY "Users can view their own organisation memberships" ON "public"."organisation_users" FOR SELECT USING (("auth"."uid"() = "user_id"));

ALTER TABLE "public"."attendee_events" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendee_events_auth_select_own" ON "public"."attendee_events" FOR SELECT TO "authenticated" USING (("attendee_id" IN ( SELECT "attendees"."attendee_id"
   FROM "public"."attendees"
  WHERE ("attendees"."registration_id" IN ( SELECT "registrations"."registration_id"
           FROM "public"."registrations"
          WHERE ("registrations"."customer_id" IN ( SELECT "contacts"."contact_id"
                   FROM "public"."contacts"
                  WHERE ("contacts"."auth_user_id" = "auth"."uid"()))))))));

ALTER TABLE "public"."attendees" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendees_auth_delete_own" ON "public"."attendees" FOR DELETE TO "authenticated" USING (("registration_id" IN ( SELECT "registrations"."registration_id"
   FROM "public"."registrations"
  WHERE (("registrations"."auth_user_id" = "auth"."uid"()) AND ("registrations"."payment_status" = 'pending'::"public"."payment_status")))));

CREATE POLICY "attendees_auth_insert_own" ON "public"."attendees" FOR INSERT TO "authenticated" WITH CHECK (("registration_id" IN ( SELECT "registrations"."registration_id"
   FROM "public"."registrations"
  WHERE (("registrations"."auth_user_id" = "auth"."uid"()) AND ("registrations"."payment_status" = 'pending'::"public"."payment_status")))));

CREATE POLICY "attendees_auth_select_own" ON "public"."attendees" FOR SELECT TO "authenticated" USING (("registration_id" IN ( SELECT "registrations"."registration_id"
   FROM "public"."registrations"
  WHERE ("registrations"."auth_user_id" = "auth"."uid"()))));

CREATE POLICY "attendees_auth_update_own" ON "public"."attendees" FOR UPDATE TO "authenticated" USING (("registration_id" IN ( SELECT "registrations"."registration_id"
   FROM "public"."registrations"
  WHERE (("registrations"."auth_user_id" = "auth"."uid"()) AND ("registrations"."payment_status" = 'pending'::"public"."payment_status")))));

ALTER TABLE "public"."connected_account_payments" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."contacts" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contacts_anon_insert" ON "public"."contacts" FOR INSERT TO "anon" WITH CHECK (("auth_user_id" IS NULL));

CREATE POLICY "contacts_auth_insert_own" ON "public"."contacts" FOR INSERT TO "authenticated" WITH CHECK (("auth_user_id" = "auth"."uid"()));

CREATE POLICY "contacts_auth_select_own" ON "public"."contacts" FOR SELECT TO "authenticated" USING (("auth_user_id" = "auth"."uid"()));

CREATE POLICY "contacts_auth_update_own" ON "public"."contacts" FOR UPDATE TO "authenticated" USING (("auth_user_id" = "auth"."uid"()));

ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_auth_insert_own" ON "public"."customers" FOR INSERT TO "authenticated" WITH CHECK (("customer_id" = "auth"."uid"()));

CREATE POLICY "customers_auth_select_own" ON "public"."customers" FOR SELECT TO "authenticated" USING (("customer_id" = "auth"."uid"()));

CREATE POLICY "customers_auth_update_own" ON "public"."customers" FOR UPDATE TO "authenticated" USING (("customer_id" = "auth"."uid"()));

ALTER TABLE "public"."event_tickets" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_anon_select_published" ON "public"."events" FOR SELECT TO "anon" USING (("is_published" = true));

CREATE POLICY "events_auth_select" ON "public"."events" FOR SELECT TO "authenticated" USING ((("is_published" = true) OR ("organiser_id" IN ( SELECT "contacts"."organisation_id"
   FROM "public"."contacts"
  WHERE ("contacts"."auth_user_id" = "auth"."uid"())))));

CREATE POLICY "events_public_select" ON "public"."events" FOR SELECT USING (true);

ALTER TABLE "public"."functions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "functions_public_select" ON "public"."functions" FOR SELECT USING (true);

ALTER TABLE "public"."grand_lodges" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grand_lodges_public_select" ON "public"."grand_lodges" FOR SELECT USING (true);

ALTER TABLE "public"."locations" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "locations_auth_insert" ON "public"."locations" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "locations_auth_update" ON "public"."locations" FOR UPDATE TO "authenticated" USING (("location_id" IN ( SELECT "events"."location_id"
   FROM "public"."events"
  WHERE ("events"."organiser_id" IN ( SELECT "contacts"."organisation_id"
           FROM "public"."contacts"
          WHERE ("contacts"."auth_user_id" = "auth"."uid"()))))));

CREATE POLICY "locations_public_select" ON "public"."locations" FOR SELECT TO "authenticated", "anon" USING (true);

ALTER TABLE "public"."lodges" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lodges_public_select" ON "public"."lodges" FOR SELECT USING (true);

ALTER TABLE "public"."masonic_profiles" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "masonic_profiles_auth_insert_own" ON "public"."masonic_profiles" FOR INSERT TO "authenticated" WITH CHECK (("contact_id" IN ( SELECT "contacts"."contact_id"
   FROM "public"."contacts"
  WHERE ("contacts"."auth_user_id" = "auth"."uid"()))));

CREATE POLICY "masonic_profiles_auth_select_own" ON "public"."masonic_profiles" FOR SELECT TO "authenticated" USING (("contact_id" IN ( SELECT "contacts"."contact_id"
   FROM "public"."contacts"
  WHERE ("contacts"."auth_user_id" = "auth"."uid"()))));

CREATE POLICY "masonic_profiles_auth_update_own" ON "public"."masonic_profiles" FOR UPDATE TO "authenticated" USING (("contact_id" IN ( SELECT "contacts"."contact_id"
   FROM "public"."contacts"
  WHERE ("contacts"."auth_user_id" = "auth"."uid"()))));

ALTER TABLE "public"."memberships" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "memberships_auth_delete_own" ON "public"."memberships" FOR DELETE TO "authenticated" USING (("contact_id" IN ( SELECT "contacts"."contact_id"
   FROM "public"."contacts"
  WHERE ("contacts"."auth_user_id" = "auth"."uid"()))));

CREATE POLICY "memberships_auth_insert_own" ON "public"."memberships" FOR INSERT TO "authenticated" WITH CHECK (("contact_id" IN ( SELECT "contacts"."contact_id"
   FROM "public"."contacts"
  WHERE ("contacts"."auth_user_id" = "auth"."uid"()))));

CREATE POLICY "memberships_auth_select_own" ON "public"."memberships" FOR SELECT TO "authenticated" USING (("contact_id" IN ( SELECT "contacts"."contact_id"
   FROM "public"."contacts"
  WHERE ("contacts"."auth_user_id" = "auth"."uid"()))));

CREATE POLICY "memberships_auth_update_own" ON "public"."memberships" FOR UPDATE TO "authenticated" USING (("contact_id" IN ( SELECT "contacts"."contact_id"
   FROM "public"."contacts"
  WHERE ("contacts"."auth_user_id" = "auth"."uid"()))));

ALTER TABLE "public"."organisation_users" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."organisations" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organisations_public_select" ON "public"."organisations" FOR SELECT USING (true);

ALTER TABLE "public"."packages" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "packages_public_select" ON "public"."packages" FOR SELECT USING (true);

ALTER TABLE "public"."raw_payloads" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."raw_registrations" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."registrations" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "registrations_anon_insert" ON "public"."registrations" FOR INSERT TO "anon" WITH CHECK (true);

CREATE POLICY "registrations_auth_insert" ON "public"."registrations" FOR INSERT TO "authenticated" WITH CHECK (("customer_id" IN ( SELECT "contacts"."contact_id"
   FROM "public"."contacts"
  WHERE ("contacts"."auth_user_id" = "auth"."uid"()))));

CREATE POLICY "registrations_auth_insert_own" ON "public"."registrations" FOR INSERT TO "authenticated" WITH CHECK (("auth_user_id" = "auth"."uid"()));

CREATE POLICY "registrations_auth_select_organizer" ON "public"."registrations" FOR SELECT TO "authenticated" USING (("function_id" IN ( SELECT "functions"."function_id"
   FROM "public"."functions"
  WHERE ("functions"."organiser_id" IN ( SELECT "contacts"."organisation_id"
           FROM "public"."contacts"
          WHERE ("contacts"."auth_user_id" = "auth"."uid"()))))));

CREATE POLICY "registrations_auth_select_own" ON "public"."registrations" FOR SELECT TO "authenticated" USING (("auth_user_id" = "auth"."uid"()));

CREATE POLICY "registrations_auth_update_own" ON "public"."registrations" FOR UPDATE TO "authenticated" USING ((("customer_id" IN ( SELECT "contacts"."contact_id"
   FROM "public"."contacts"
  WHERE ("contacts"."auth_user_id" = "auth"."uid"()))) AND ("payment_status" = 'pending'::"public"."payment_status")));

CREATE POLICY "registrations_auth_update_pending" ON "public"."registrations" FOR UPDATE TO "authenticated" USING ((("auth_user_id" = "auth"."uid"()) AND ("payment_status" = 'pending'::"public"."payment_status")));

CREATE POLICY "registrations_insert_own" ON "public"."registrations" FOR INSERT TO "authenticated" WITH CHECK ((("auth_user_id" = "auth"."uid"()) OR ("customer_id" = "auth"."uid"())));

CREATE POLICY "registrations_select_own" ON "public"."registrations" FOR SELECT TO "authenticated" USING ((("auth_user_id" = "auth"."uid"()) OR ("customer_id" = "auth"."uid"())));

CREATE POLICY "registrations_update_own" ON "public"."registrations" FOR UPDATE TO "authenticated" USING (((("auth_user_id" = "auth"."uid"()) OR ("customer_id" = "auth"."uid"())) AND ("payment_status" = ANY (ARRAY['pending'::"public"."payment_status", 'unpaid'::"public"."payment_status"]))));

ALTER TABLE "public"."tickets" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tickets_auth_insert_own" ON "public"."tickets" FOR INSERT TO "authenticated" WITH CHECK (("registration_id" IN ( SELECT "registrations"."registration_id"
   FROM "public"."registrations"
  WHERE (("registrations"."auth_user_id" = "auth"."uid"()) AND ("registrations"."payment_status" = 'pending'::"public"."payment_status")))));

CREATE POLICY "tickets_auth_select_organizer" ON "public"."tickets" FOR SELECT TO "authenticated" USING (("event_id" IN ( SELECT "events"."event_id"
   FROM "public"."events"
  WHERE ("events"."organiser_id" IN ( SELECT "contacts"."organisation_id"
           FROM "public"."contacts"
          WHERE ("contacts"."auth_user_id" = "auth"."uid"()))))));

CREATE POLICY "tickets_auth_select_own" ON "public"."tickets" FOR SELECT TO "authenticated" USING (("registration_id" IN ( SELECT "registrations"."registration_id"
   FROM "public"."registrations"
  WHERE ("registrations"."auth_user_id" = "auth"."uid"()))));

CREATE POLICY "tickets_auth_update_own" ON "public"."tickets" FOR UPDATE TO "authenticated" USING (("registration_id" IN ( SELECT "registrations"."registration_id"
   FROM "public"."registrations"
  WHERE (("registrations"."auth_user_id" = "auth"."uid"()) AND ("registrations"."payment_status" = 'pending'::"public"."payment_status")))));

ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_roles_auth_select_own" ON "public"."user_roles" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));

ALTER TABLE "public"."webhook_logs" ENABLE ROW LEVEL SECURITY;
