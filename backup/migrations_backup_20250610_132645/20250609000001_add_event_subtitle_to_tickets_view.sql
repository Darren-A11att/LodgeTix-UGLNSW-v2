-- Add event_subtitle to function_event_tickets_view
-- Drop the existing view first to avoid column order conflicts
DROP VIEW IF EXISTS "public"."function_event_tickets_view";

-- Recreate view with event_subtitle column
CREATE VIEW "public"."function_event_tickets_view" WITH ("security_invoker"='on') AS
 SELECT "f"."function_id",
    "f"."name" AS "function_name",
    "f"."slug" AS "function_slug",
    "f"."description" AS "function_description",
    "f"."start_date" AS "function_start_date",
    "f"."end_date" AS "function_end_date",
    "e"."event_id",
    "e"."title" AS "event_title",
    "e"."subtitle" AS "event_subtitle",
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
     JOIN "public"."event_tickets" "et" ON (("e"."event_id" = "et"."event_id")));