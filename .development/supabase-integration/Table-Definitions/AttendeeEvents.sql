   CREATE TABLE public."AttendeeEvents" (
     "id" uuid NOT NULL DEFAULT gen_random_uuid(),
     "attendeeId" uuid NOT NULL,
     "eventId" uuid NOT NULL,
     "status" varchar(50) NOT NULL DEFAULT 'confirmed',
     "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
     CONSTRAINT attendee_events_pkey PRIMARY KEY ("id"),
     CONSTRAINT attendee_events_attendee_id_fkey FOREIGN KEY ("attendeeId") 
       REFERENCES public."Attendees" (attendeeid) ON DELETE CASCADE,
     CONSTRAINT attendee_events_event_id_fkey FOREIGN KEY ("eventId")
       REFERENCES public."Events" (id) ON DELETE CASCADE
   );