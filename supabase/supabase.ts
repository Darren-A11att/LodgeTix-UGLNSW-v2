export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      attendee_ticket_assignments: {
        Row: {
          attendee_id: string | null
          created_at: string
          id: string
          price_at_assignment: number
          registration_id: string
          ticket_definition_id: string
        }
        Insert: {
          attendee_id?: string | null
          created_at?: string
          id?: string
          price_at_assignment: number
          registration_id: string
          ticket_definition_id: string
        }
        Update: {
          attendee_id?: string | null
          created_at?: string
          id?: string
          price_at_assignment?: number
          registration_id?: string
          ticket_definition_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendee_ticket_assignments_attendee_id_fkey"
            columns: ["attendee_id"]
            isOneToOne: false
            referencedRelation: "attendees"
            referencedColumns: ["attendeeid"]
          },
          {
            foreignKeyName: "attendee_ticket_assignments_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registration_payments"
            referencedColumns: ["registration_id"]
          },
          {
            foreignKeyName: "attendee_ticket_assignments_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registration_summary"
            referencedColumns: ["registration_id"]
          },
          {
            foreignKeyName: "attendee_ticket_assignments_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["registration_id"]
          },
          {
            foreignKeyName: "attendee_ticket_assignments_ticket_definition_id_fkey"
            columns: ["ticket_definition_id"]
            isOneToOne: false
            referencedRelation: "ticket_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      attendeeevents: {
        Row: {
          attendee_id: string
          created_at: string
          event_id: string
          id: string
          status: string
        }
        Insert: {
          attendee_id: string
          created_at?: string
          event_id: string
          id?: string
          status?: string
        }
        Update: {
          attendee_id?: string
          created_at?: string
          event_id?: string
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendee_events_attendee_id_fkey"
            columns: ["attendee_id"]
            isOneToOne: false
            referencedRelation: "attendees"
            referencedColumns: ["attendeeid"]
          },
          {
            foreignKeyName: "attendee_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendee_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "formatted_events"
            referencedColumns: ["id"]
          },
        ]
      }
      attendees: {
        Row: {
          attendeeid: string
          attendeetype: Database["public"]["Enums"]["attendee_type"]
          contactpreference: Database["public"]["Enums"]["attendee_contact_preference"]
          createdat: string
          dietaryrequirements: string | null
          eventtitle: string | null
          person_id: string | null
          registrationid: string
          relatedattendeeid: string | null
          relationship: string | null
          specialneeds: string | null
          updatedat: string
        }
        Insert: {
          attendeeid?: string
          attendeetype: Database["public"]["Enums"]["attendee_type"]
          contactpreference: Database["public"]["Enums"]["attendee_contact_preference"]
          createdat?: string
          dietaryrequirements?: string | null
          eventtitle?: string | null
          person_id?: string | null
          registrationid: string
          relatedattendeeid?: string | null
          relationship?: string | null
          specialneeds?: string | null
          updatedat?: string
        }
        Update: {
          attendeeid?: string
          attendeetype?: Database["public"]["Enums"]["attendee_type"]
          contactpreference?: Database["public"]["Enums"]["attendee_contact_preference"]
          createdat?: string
          dietaryrequirements?: string | null
          eventtitle?: string | null
          person_id?: string | null
          registrationid?: string
          relatedattendeeid?: string | null
          relationship?: string | null
          specialneeds?: string | null
          updatedat?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendees_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "attendees_registrationid_fkey"
            columns: ["registrationid"]
            isOneToOne: false
            referencedRelation: "registration_payments"
            referencedColumns: ["registration_id"]
          },
          {
            foreignKeyName: "attendees_registrationid_fkey"
            columns: ["registrationid"]
            isOneToOne: false
            referencedRelation: "registration_summary"
            referencedColumns: ["registration_id"]
          },
          {
            foreignKeyName: "attendees_registrationid_fkey"
            columns: ["registrationid"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["registration_id"]
          },
          {
            foreignKeyName: "attendees_relatedattendeeid_fkey"
            columns: ["relatedattendeeid"]
            isOneToOne: false
            referencedRelation: "attendees"
            referencedColumns: ["attendeeid"]
          },
        ]
      }
      content: {
        Row: {
          created_at: string | null
          description: string
          id: string
          order: number | null
          page: string
          section: string
          subtitle: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          order?: number | null
          page: string
          section: string
          subtitle?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          order?: number | null
          page?: string
          section?: string
          subtitle?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      content_features: {
        Row: {
          created_at: string | null
          description: string
          icon: string | null
          id: string
          order: number | null
          page: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          icon?: string | null
          id?: string
          order?: number | null
          page: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          icon?: string | null
          id?: string
          order?: number | null
          page?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      content_values: {
        Row: {
          created_at: string | null
          description: string
          id: string
          order: number | null
          page: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          order?: number | null
          page: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          order?: number | null
          page?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          billing_city: string | null
          billing_country: string | null
          billing_email: string | null
          billing_first_name: string | null
          billing_last_name: string | null
          billing_organisation_name: string | null
          billing_phone: string | null
          billing_postal_code: string | null
          billing_state: string | null
          billing_street_address: string | null
          business_name: string | null
          city: string | null
          contact_id: string | null
          country: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          organisation_id: string | null
          person_id: string | null
          phone: string | null
          postal_code: string | null
          state: string | null
          stripe_customer_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_email?: string | null
          billing_first_name?: string | null
          billing_last_name?: string | null
          billing_organisation_name?: string | null
          billing_phone?: string | null
          billing_postal_code?: string | null
          billing_state?: string | null
          billing_street_address?: string | null
          business_name?: string | null
          city?: string | null
          contact_id?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          organisation_id?: string | null
          person_id?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_email?: string | null
          billing_first_name?: string | null
          billing_last_name?: string | null
          billing_organisation_name?: string | null
          billing_phone?: string | null
          billing_postal_code?: string | null
          billing_state?: string | null
          billing_street_address?: string | null
          business_name?: string | null
          city?: string | null
          contact_id?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          organisation_id?: string | null
          person_id?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["person_id"]
          },
        ]
      }
      displayscopes: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      event_capacity: {
        Row: {
          created_at: string
          event_id: string
          max_capacity: number
          reserved_count: number
          sold_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          max_capacity: number
          reserved_count?: number
          sold_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          max_capacity?: number
          reserved_count?: number
          sold_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_capacity_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_capacity_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "formatted_events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_fees: {
        Row: {
          applies_to: string
          created_at: string
          event_fee_id: string
          event_id: string
          fee_type_id: string
          fee_value: number
          is_active: boolean
          is_passed_to_customer: boolean
          updated_at: string
        }
        Insert: {
          applies_to: string
          created_at?: string
          event_fee_id?: string
          event_id: string
          fee_type_id: string
          fee_value: number
          is_active?: boolean
          is_passed_to_customer?: boolean
          updated_at?: string
        }
        Update: {
          applies_to?: string
          created_at?: string
          event_fee_id?: string
          event_id?: string
          fee_type_id?: string
          fee_value?: number
          is_active?: boolean
          is_passed_to_customer?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_fees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_fees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "formatted_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_fees_fee_type_id_fkey"
            columns: ["fee_type_id"]
            isOneToOne: false
            referencedRelation: "fee_types"
            referencedColumns: ["fee_type_id"]
          },
        ]
      }
      event_vas_options: {
        Row: {
          event_id: string | null
          id: string
          price_override: number | null
          vas_id: string | null
        }
        Insert: {
          event_id?: string | null
          id?: string
          price_override?: number | null
          vas_id?: string | null
        }
        Update: {
          event_id?: string | null
          id?: string
          price_override?: number | null
          vas_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_vas_options_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_vas_options_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "formatted_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_vas_options_vas_id_fkey"
            columns: ["vas_id"]
            isOneToOne: false
            referencedRelation: "value_added_services"
            referencedColumns: ["id"]
          },
        ]
      }
      eventpackages: {
        Row: {
          created_at: string
          description: string | null
          id: string
          includes_description: string[] | null
          name: string
          parent_event_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          includes_description?: string[] | null
          name: string
          parent_event_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          includes_description?: string[] | null
          name?: string
          parent_event_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "packages_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packages_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "formatted_events"
            referencedColumns: ["id"]
          },
        ]
      }
      eventpackagetickets: {
        Row: {
          created_at: string
          event_ticket_id: string
          id: string
          package_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_ticket_id: string
          id?: string
          package_id: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_ticket_id?: string
          id?: string
          package_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_package_tickets_event_ticket_id_fkey"
            columns: ["event_ticket_id"]
            isOneToOne: false
            referencedRelation: "eventtickets"
            referencedColumns: ["event_ticket_id"]
          },
          {
            foreignKeyName: "event_package_tickets_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "eventpackages"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          attendance: Json | null
          created_at: string
          degree_type: string | null
          description: string | null
          display_scope_id: string | null
          documents: Json | null
          dress_code: string | null
          event_end: string | null
          event_id: string | null
          event_includes: string[] | null
          event_start: string | null
          featured: boolean | null
          id: string
          image_url: string | null
          important_information: string[] | null
          is_multi_day: boolean | null
          is_published: boolean | null
          is_purchasable_individually: boolean | null
          latitude: number | null
          location: string | null
          location_json: Json | null
          locationid: string | null
          longitude: number | null
          max_attendees: number | null
          organiser_logo: string | null
          organiserorganisationid: string | null
          organizer_contact: Json | null
          organizer_name: string | null
          parent_event_id: string | null
          price: number | null
          publish_option: string | null
          regalia: string | null
          regalia_description: string | null
          registration_availability_id: string | null
          related_events: string[] | null
          sections: Json | null
          slug: string
          subtitle: string | null
          title: string
          type: string | null
        }
        Insert: {
          attendance?: Json | null
          created_at?: string
          degree_type?: string | null
          description?: string | null
          display_scope_id?: string | null
          documents?: Json | null
          dress_code?: string | null
          event_end?: string | null
          event_id?: string | null
          event_includes?: string[] | null
          event_start?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          important_information?: string[] | null
          is_multi_day?: boolean | null
          is_published?: boolean | null
          is_purchasable_individually?: boolean | null
          latitude?: number | null
          location?: string | null
          location_json?: Json | null
          locationid?: string | null
          longitude?: number | null
          max_attendees?: number | null
          organiser_logo?: string | null
          organiserorganisationid?: string | null
          organizer_contact?: Json | null
          organizer_name?: string | null
          parent_event_id?: string | null
          price?: number | null
          publish_option?: string | null
          regalia?: string | null
          regalia_description?: string | null
          registration_availability_id?: string | null
          related_events?: string[] | null
          sections?: Json | null
          slug: string
          subtitle?: string | null
          title: string
          type?: string | null
        }
        Update: {
          attendance?: Json | null
          created_at?: string
          degree_type?: string | null
          description?: string | null
          display_scope_id?: string | null
          documents?: Json | null
          dress_code?: string | null
          event_end?: string | null
          event_id?: string | null
          event_includes?: string[] | null
          event_start?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          important_information?: string[] | null
          is_multi_day?: boolean | null
          is_published?: boolean | null
          is_purchasable_individually?: boolean | null
          latitude?: number | null
          location?: string | null
          location_json?: Json | null
          locationid?: string | null
          longitude?: number | null
          max_attendees?: number | null
          organiser_logo?: string | null
          organiserorganisationid?: string | null
          organizer_contact?: Json | null
          organizer_name?: string | null
          parent_event_id?: string | null
          price?: number | null
          publish_option?: string | null
          regalia?: string | null
          regalia_description?: string | null
          registration_availability_id?: string | null
          related_events?: string[] | null
          sections?: Json | null
          slug?: string
          subtitle?: string | null
          title?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_display_scope_id_fkey"
            columns: ["display_scope_id"]
            isOneToOne: false
            referencedRelation: "displayscopes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_locationid_fkey"
            columns: ["locationid"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["locationid"]
          },
          {
            foreignKeyName: "events_organiserorganisationid_fkey"
            columns: ["organiserorganisationid"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["organisationid"]
          },
          {
            foreignKeyName: "events_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "formatted_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_registration_availability_id_fkey"
            columns: ["registration_availability_id"]
            isOneToOne: false
            referencedRelation: "registration_availabilities"
            referencedColumns: ["id"]
          },
        ]
      }
      eventtickets: {
        Row: {
          available_count: number
          created_at: string
          event_id: string
          event_ticket_id: string
          event_uuid: string | null
          price: number
          reserved_count: number
          sold_count: number
          status: string
          ticket_definition_id: string | null
          total_capacity: number
          updated_at: string
        }
        Insert: {
          available_count: number
          created_at?: string
          event_id: string
          event_ticket_id?: string
          event_uuid?: string | null
          price: number
          reserved_count?: number
          sold_count?: number
          status?: string
          ticket_definition_id?: string | null
          total_capacity: number
          updated_at?: string
        }
        Update: {
          available_count?: number
          created_at?: string
          event_id?: string
          event_ticket_id?: string
          event_uuid?: string | null
          price?: number
          reserved_count?: number
          sold_count?: number
          status?: string
          ticket_definition_id?: string | null
          total_capacity?: number
          updated_at?: string
        }
        Relationships: []
      }
      fee_types: {
        Row: {
          created_at: string
          description: string | null
          fee_calculation_type: string
          fee_default_value: number
          fee_type_id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          fee_calculation_type: string
          fee_default_value?: number
          fee_type_id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          fee_calculation_type?: string
          fee_default_value?: number
          fee_type_id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      grand_lodges: {
        Row: {
          abbreviation: string | null
          country: string | null
          country_code_iso3: string | null
          created_at: string
          id: string
          name: string
          state_region: string | null
          state_region_code: string | null
        }
        Insert: {
          abbreviation?: string | null
          country?: string | null
          country_code_iso3?: string | null
          created_at?: string
          id?: string
          name: string
          state_region?: string | null
          state_region_code?: string | null
        }
        Update: {
          abbreviation?: string | null
          country?: string | null
          country_code_iso3?: string | null
          created_at?: string
          id?: string
          name?: string
          state_region?: string | null
          state_region_code?: string | null
        }
        Relationships: []
      }
      locations: {
        Row: {
          capacity: number | null
          country: string | null
          createdat: string
          latitude: number | null
          locationid: string
          longitude: number | null
          placename: string
          postalcode: string | null
          roomorarea: string | null
          state: string | null
          streetaddress: string | null
          suburb: string | null
          updatedat: string
        }
        Insert: {
          capacity?: number | null
          country?: string | null
          createdat?: string
          latitude?: number | null
          locationid?: string
          longitude?: number | null
          placename: string
          postalcode?: string | null
          roomorarea?: string | null
          state?: string | null
          streetaddress?: string | null
          suburb?: string | null
          updatedat?: string
        }
        Update: {
          capacity?: number | null
          country?: string | null
          createdat?: string
          latitude?: number | null
          locationid?: string
          longitude?: number | null
          placename?: string
          postalcode?: string | null
          roomorarea?: string | null
          state?: string | null
          streetaddress?: string | null
          suburb?: string | null
          updatedat?: string
        }
        Relationships: []
      }
      lodges: {
        Row: {
          area_type: string | null
          created_at: string
          display_name: string | null
          district: string | null
          grand_lodge_id: string | null
          id: string
          meeting_place: string | null
          name: string
          number: number | null
          state_region: string | null
        }
        Insert: {
          area_type?: string | null
          created_at?: string
          display_name?: string | null
          district?: string | null
          grand_lodge_id?: string | null
          id?: string
          meeting_place?: string | null
          name: string
          number?: number | null
          state_region?: string | null
        }
        Update: {
          area_type?: string | null
          created_at?: string
          display_name?: string | null
          district?: string | null
          grand_lodge_id?: string | null
          id?: string
          meeting_place?: string | null
          name?: string
          number?: number | null
          state_region?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lodges_grand_lodge_id_fkey"
            columns: ["grand_lodge_id"]
            isOneToOne: false
            referencedRelation: "grand_lodges"
            referencedColumns: ["id"]
          },
        ]
      }
      masonicprofiles: {
        Row: {
          createdat: string
          grandoffice: string | null
          grandofficer: string | null
          grandrank: string | null
          lodgeid: string | null
          masonicprofileid: string
          masonictitle: string | null
          person_id: string | null
          rank: string | null
          updatedat: string
        }
        Insert: {
          createdat?: string
          grandoffice?: string | null
          grandofficer?: string | null
          grandrank?: string | null
          lodgeid?: string | null
          masonicprofileid?: string
          masonictitle?: string | null
          person_id?: string | null
          rank?: string | null
          updatedat?: string
        }
        Update: {
          createdat?: string
          grandoffice?: string | null
          grandofficer?: string | null
          grandrank?: string | null
          lodgeid?: string | null
          masonicprofileid?: string
          masonictitle?: string | null
          person_id?: string | null
          rank?: string | null
          updatedat?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_masonicprofiles_organisation_link"
            columns: ["lodgeid"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["organisationid"]
          },
          {
            foreignKeyName: "masonicprofiles_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: true
            referencedRelation: "people"
            referencedColumns: ["person_id"]
          },
        ]
      }
      organisationmemberships: {
        Row: {
          createdat: string
          isprimarycontact: boolean | null
          membershipid: string
          organisationid: string
          person_id: string | null
          roleinorg: string | null
          updatedat: string
        }
        Insert: {
          createdat?: string
          isprimarycontact?: boolean | null
          membershipid?: string
          organisationid: string
          person_id?: string | null
          roleinorg?: string | null
          updatedat?: string
        }
        Update: {
          createdat?: string
          isprimarycontact?: boolean | null
          membershipid?: string
          organisationid?: string
          person_id?: string | null
          roleinorg?: string | null
          updatedat?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisationmemberships_organisationid_fkey"
            columns: ["organisationid"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["organisationid"]
          },
          {
            foreignKeyName: "organisationmemberships_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["person_id"]
          },
        ]
      }
      organisations: {
        Row: {
          city: string | null
          country: string | null
          createdat: string
          name: string
          organisationid: string
          parent_id: string | null
          postalcode: string | null
          state: string | null
          streetaddress: string | null
          type: Database["public"]["Enums"]["organisation_type"]
          updatedat: string
          website: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          createdat?: string
          name: string
          organisationid?: string
          parent_id?: string | null
          postalcode?: string | null
          state?: string | null
          streetaddress?: string | null
          type: Database["public"]["Enums"]["organisation_type"]
          updatedat?: string
          website?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          createdat?: string
          name?: string
          organisationid?: string
          parent_id?: string | null
          postalcode?: string | null
          state?: string | null
          streetaddress?: string | null
          type?: Database["public"]["Enums"]["organisation_type"]
          updatedat?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organisations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["organisationid"]
          },
        ]
      }
      package_events: {
        Row: {
          event_id: string | null
          id: string
          package_id: string | null
        }
        Insert: {
          event_id?: string | null
          id?: string
          package_id?: string | null
        }
        Update: {
          event_id?: string | null
          id?: string
          package_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "package_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "formatted_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_events_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "eventpackages"
            referencedColumns: ["id"]
          },
        ]
      }
      package_vas_options: {
        Row: {
          id: string
          package_id: string | null
          price_override: number | null
          vas_id: string | null
        }
        Insert: {
          id?: string
          package_id?: string | null
          price_override?: number | null
          vas_id?: string | null
        }
        Update: {
          id?: string
          package_id?: string | null
          price_override?: number | null
          vas_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "package_vas_options_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "eventpackages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_vas_options_vas_id_fkey"
            columns: ["vas_id"]
            isOneToOne: false
            referencedRelation: "value_added_services"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          auth_user_id: string | null
          city: string | null
          country: string | null
          created_at: string
          dietary_requirements: string | null
          first_name: string | null
          is_organisation: boolean
          last_name: string | null
          person_id: string
          postal_code: string | null
          primary_email: string | null
          primary_phone: string | null
          special_needs: string | null
          state: string | null
          street_address: string | null
          suffix: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          dietary_requirements?: string | null
          first_name?: string | null
          is_organisation?: boolean
          last_name?: string | null
          person_id?: string
          postal_code?: string | null
          primary_email?: string | null
          primary_phone?: string | null
          special_needs?: string | null
          state?: string | null
          street_address?: string | null
          suffix?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          dietary_requirements?: string | null
          first_name?: string | null
          is_organisation?: boolean
          last_name?: string | null
          person_id?: string
          postal_code?: string | null
          primary_email?: string | null
          primary_phone?: string | null
          special_needs?: string | null
          state?: string | null
          street_address?: string | null
          suffix?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      price_tiers: {
        Row: {
          created_at: string
          description: string | null
          is_active: boolean
          name: string
          tier_id: string
          tier_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          is_active?: boolean
          name: string
          tier_id?: string
          tier_order: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          is_active?: boolean
          name?: string
          tier_id?: string
          tier_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      registration_availabilities: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      registration_vas: {
        Row: {
          created_at: string
          id: string
          price_at_purchase: number
          quantity: number
          registration_id: string
          vas_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          price_at_purchase: number
          quantity?: number
          registration_id: string
          vas_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          price_at_purchase?: number
          quantity?: number
          registration_id?: string
          vas_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registration_vas_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registration_payments"
            referencedColumns: ["registration_id"]
          },
          {
            foreignKeyName: "registration_vas_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registration_summary"
            referencedColumns: ["registration_id"]
          },
          {
            foreignKeyName: "registration_vas_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["registration_id"]
          },
          {
            foreignKeyName: "registration_vas_vas_id_fkey"
            columns: ["vas_id"]
            isOneToOne: false
            referencedRelation: "value_added_services"
            referencedColumns: ["id"]
          },
        ]
      }
      registrations: {
        Row: {
          agree_to_terms: boolean | null
          created_at: string | null
          customer_id: string | null
          event_id: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          primary_attendee_id: string | null
          registration_data: Json[] | null
          registration_date: string | null
          registration_id: string
          registration_type:
            | Database["public"]["Enums"]["registration_type"]
            | null
          status: string | null
          stripe_payment_intent_id: string | null
          total_amount_paid: number | null
          total_price_paid: number | null
          updated_at: string | null
        }
        Insert: {
          agree_to_terms?: boolean | null
          created_at?: string | null
          customer_id?: string | null
          event_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          primary_attendee_id?: string | null
          registration_data?: Json[] | null
          registration_date?: string | null
          registration_id: string
          registration_type?:
            | Database["public"]["Enums"]["registration_type"]
            | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          total_amount_paid?: number | null
          total_price_paid?: number | null
          updated_at?: string | null
        }
        Update: {
          agree_to_terms?: boolean | null
          created_at?: string | null
          customer_id?: string | null
          event_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          primary_attendee_id?: string | null
          registration_data?: Json[] | null
          registration_date?: string | null
          registration_id?: string
          registration_type?:
            | Database["public"]["Enums"]["registration_type"]
            | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          total_amount_paid?: number | null
          total_price_paid?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registrations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_definitions: {
        Row: {
          created_at: string
          description: string | null
          eligibility_attendee_types: string[] | null
          eligibility_mason_rank: string | null
          event_id: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          eligibility_attendee_types?: string[] | null
          eligibility_mason_rank?: string | null
          event_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
        }
        Update: {
          created_at?: string
          description?: string | null
          eligibility_attendee_types?: string[] | null
          eligibility_mason_rank?: string | null
          event_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "ticket_definitions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_definitions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "formatted_events"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_type_price_tiers: {
        Row: {
          created_at: string
          end_datetime: string
          id: string
          is_active: boolean
          price: number
          price_tier_id: string
          quantity_limit: number | null
          quantity_sold: number
          start_datetime: string
          ticket_definition_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_datetime: string
          id?: string
          is_active?: boolean
          price: number
          price_tier_id: string
          quantity_limit?: number | null
          quantity_sold?: number
          start_datetime: string
          ticket_definition_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_datetime?: string
          id?: string
          is_active?: boolean
          price?: number
          price_tier_id?: string
          quantity_limit?: number | null
          quantity_sold?: number
          start_datetime?: string
          ticket_definition_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_type_price_tiers_price_tier_id_fkey"
            columns: ["price_tier_id"]
            isOneToOne: false
            referencedRelation: "price_tiers"
            referencedColumns: ["tier_id"]
          },
          {
            foreignKeyName: "ticket_type_price_tiers_ticket_definition_id_fkey"
            columns: ["ticket_definition_id"]
            isOneToOne: false
            referencedRelation: "ticket_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          attendee_id: string | null
          checked_in_at: string | null
          created_at: string
          currency: string | null
          event_id: string
          event_ticket_id: string | null
          id: string | null
          is_partner_ticket: boolean | null
          original_price: number | null
          package_id: string | null
          payment_status: string | null
          price_paid: number
          purchased_at: string | null
          registration_id: string | null
          reservation_expires_at: string | null
          reservation_id: string | null
          seat_info: string | null
          status: string
          ticket_definition_id: string | null
          ticket_id: string
          ticket_price: number | null
          ticket_status: string | null
          ticket_type_id: string | null
          updated_at: string
        }
        Insert: {
          attendee_id?: string | null
          checked_in_at?: string | null
          created_at?: string
          currency?: string | null
          event_id: string
          event_ticket_id?: string | null
          id?: string | null
          is_partner_ticket?: boolean | null
          original_price?: number | null
          package_id?: string | null
          payment_status?: string | null
          price_paid: number
          purchased_at?: string | null
          registration_id?: string | null
          reservation_expires_at?: string | null
          reservation_id?: string | null
          seat_info?: string | null
          status?: string
          ticket_definition_id?: string | null
          ticket_id?: string
          ticket_price?: number | null
          ticket_status?: string | null
          ticket_type_id?: string | null
          updated_at?: string
        }
        Update: {
          attendee_id?: string | null
          checked_in_at?: string | null
          created_at?: string
          currency?: string | null
          event_id?: string
          event_ticket_id?: string | null
          id?: string | null
          is_partner_ticket?: boolean | null
          original_price?: number | null
          package_id?: string | null
          payment_status?: string | null
          price_paid?: number
          purchased_at?: string | null
          registration_id?: string | null
          reservation_expires_at?: string | null
          reservation_id?: string | null
          seat_info?: string | null
          status?: string
          ticket_definition_id?: string | null
          ticket_id?: string
          ticket_price?: number | null
          ticket_status?: string | null
          ticket_type_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_attendeeid_fkey"
            columns: ["attendee_id"]
            isOneToOne: false
            referencedRelation: "attendees"
            referencedColumns: ["attendeeid"]
          },
          {
            foreignKeyName: "tickets_event_ticket_id_fkey"
            columns: ["event_ticket_id"]
            isOneToOne: false
            referencedRelation: "eventtickets"
            referencedColumns: ["event_ticket_id"]
          },
          {
            foreignKeyName: "tickets_eventid_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_eventid_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "formatted_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "eventpackages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registration_payments"
            referencedColumns: ["registration_id"]
          },
          {
            foreignKeyName: "tickets_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registration_summary"
            referencedColumns: ["registration_id"]
          },
          {
            foreignKeyName: "tickets_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["registration_id"]
          },
          {
            foreignKeyName: "tickets_ticketdefinitionid_fkey"
            columns: ["ticket_definition_id"]
            isOneToOne: false
            referencedRelation: "ticket_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      value_added_services: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          type: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          type?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      formatted_events: {
        Row: {
          attendance: Json | null
          createdAt: string | null
          date_formatted: string | null
          day_formatted: string | null
          degree_type: string | null
          description: string | null
          displayScopeId: string | null
          documents: Json | null
          dress_code: string | null
          duration_hours: number | null
          eventEnd: string | null
          eventId: string | null
          eventIncludes: string[] | null
          eventStart: string | null
          featured: boolean | null
          id: string | null
          imageUrl: string | null
          importantInformation: string[] | null
          is_multi_day_calc: boolean | null
          is_published: boolean | null
          isMultiDay: boolean | null
          isPurchasableIndividually: boolean | null
          latitude: number | null
          location: string | null
          location_json: Json | null
          locationid: string | null
          longitude: number | null
          maxAttendees: number | null
          organiserorganisationid: string | null
          organizer_contact: Json | null
          organizer_name: string | null
          parentEventId: string | null
          price: number | null
          publish_option: string | null
          regalia: string | null
          regalia_description: string | null
          registrationAvailabilityId: string | null
          related_events: string[] | null
          sections: Json | null
          slug: string | null
          subtitle: string | null
          time_formatted: string | null
          title: string | null
          type: string | null
          until_formatted: string | null
        }
        Insert: {
          attendance?: Json | null
          createdAt?: string | null
          date_formatted?: never
          day_formatted?: never
          degree_type?: string | null
          description?: string | null
          displayScopeId?: string | null
          documents?: Json | null
          dress_code?: string | null
          duration_hours?: never
          eventEnd?: string | null
          eventId?: string | null
          eventIncludes?: string[] | null
          eventStart?: string | null
          featured?: boolean | null
          id?: string | null
          imageUrl?: string | null
          importantInformation?: string[] | null
          is_multi_day_calc?: never
          is_published?: boolean | null
          isMultiDay?: boolean | null
          isPurchasableIndividually?: boolean | null
          latitude?: number | null
          location?: string | null
          location_json?: Json | null
          locationid?: string | null
          longitude?: number | null
          maxAttendees?: number | null
          organiserorganisationid?: string | null
          organizer_contact?: Json | null
          organizer_name?: string | null
          parentEventId?: string | null
          price?: number | null
          publish_option?: string | null
          regalia?: string | null
          regalia_description?: string | null
          registrationAvailabilityId?: string | null
          related_events?: string[] | null
          sections?: Json | null
          slug?: string | null
          subtitle?: string | null
          time_formatted?: never
          title?: string | null
          type?: string | null
          until_formatted?: never
        }
        Update: {
          attendance?: Json | null
          createdAt?: string | null
          date_formatted?: never
          day_formatted?: never
          degree_type?: string | null
          description?: string | null
          displayScopeId?: string | null
          documents?: Json | null
          dress_code?: string | null
          duration_hours?: never
          eventEnd?: string | null
          eventId?: string | null
          eventIncludes?: string[] | null
          eventStart?: string | null
          featured?: boolean | null
          id?: string | null
          imageUrl?: string | null
          importantInformation?: string[] | null
          is_multi_day_calc?: never
          is_published?: boolean | null
          isMultiDay?: boolean | null
          isPurchasableIndividually?: boolean | null
          latitude?: number | null
          location?: string | null
          location_json?: Json | null
          locationid?: string | null
          longitude?: number | null
          maxAttendees?: number | null
          organiserorganisationid?: string | null
          organizer_contact?: Json | null
          organizer_name?: string | null
          parentEventId?: string | null
          price?: number | null
          publish_option?: string | null
          regalia?: string | null
          regalia_description?: string | null
          registrationAvailabilityId?: string | null
          related_events?: string[] | null
          sections?: Json | null
          slug?: string | null
          subtitle?: string | null
          time_formatted?: never
          title?: string | null
          type?: string | null
          until_formatted?: never
        }
        Relationships: [
          {
            foreignKeyName: "events_display_scope_id_fkey"
            columns: ["displayScopeId"]
            isOneToOne: false
            referencedRelation: "displayscopes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_locationid_fkey"
            columns: ["locationid"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["locationid"]
          },
          {
            foreignKeyName: "events_organiserorganisationid_fkey"
            columns: ["organiserorganisationid"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["organisationid"]
          },
          {
            foreignKeyName: "events_parent_event_id_fkey"
            columns: ["parentEventId"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_parent_event_id_fkey"
            columns: ["parentEventId"]
            isOneToOne: false
            referencedRelation: "formatted_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_registration_availability_id_fkey"
            columns: ["registrationAvailabilityId"]
            isOneToOne: false
            referencedRelation: "registration_availabilities"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_payments: {
        Row: {
          payment_intent_id: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          registration_id: string | null
          registration_status: string | null
          stripe_amount: number | null
          stripe_payment_status: string | null
          total_paid: number | null
          total_price: number | null
        }
        Relationships: []
      }
      registration_summary: {
        Row: {
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          event_id: string | null
          event_title: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          primary_attendee_id: string | null
          registration_date: string | null
          registration_id: string | null
          registration_type:
            | Database["public"]["Enums"]["registration_type"]
            | null
          status: string | null
          total_amount_paid: number | null
          total_price_paid: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registrations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      broadcast_high_demand_event: {
        Args: { event_id: string }
        Returns: boolean
      }
      cancel_reservation: {
        Args: { p_reservation_id: string } | { p_reservation_id: string }
        Returns: number
      }
      cancel_reservation_simple: {
        Args: { p_reservation_id: string }
        Returns: boolean
      }
      check_payment_intent_status: {
        Args: { payment_intent_id: string }
        Returns: Json
      }
      clear_expired_reservations: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      complete_reservation: {
        Args:
          | { p_reservation_id: string; p_attendee_id: string }
          | { p_reservation_id: string; p_attendee_id: string }
        Returns: string[]
      }
      complete_reservation_simple: {
        Args: { p_reservation_id: string; p_attendee_id: string }
        Returns: string[]
      }
      confirm_event_capacity: {
        Args: { p_event_id: string; p_quantity?: number }
        Returns: boolean
      }
      create_registration: {
        Args: {
          registration_data: Json
          attendees_data: Json
          tickets_data: Json
        }
        Returns: Json
      }
      get_event_availability: {
        Args: { p_event_id: string }
        Returns: Json
      }
      get_ticket_availability: {
        Args:
          | { p_event_id: string; p_ticket_definition_id: string }
          | { p_event_id: string; p_ticket_definition_id: string }
        Returns: Json
      }
      get_ticket_availability_text: {
        Args: { p_event_id: string; p_ticket_definition_id: string }
        Returns: Json
      }
      get_ticket_availability_uuid: {
        Args: { p_event_id: string; p_ticket_definition_id: string }
        Returns: Json
      }
      hello_tickets: {
        Args: { name: string }
        Returns: string
      }
      initialize_event_capacity: {
        Args: { p_event_id: string; p_max_capacity?: number }
        Returns: {
          created_at: string
          event_id: string
          max_capacity: number
          reserved_count: number
          sold_count: number
          updated_at: string
        }
      }
      is_event_high_demand: {
        Args: { p_event_id: string; p_threshold_percent?: number }
        Returns: boolean
      }
      is_ticket_high_demand: {
        Args: {
          p_event_id: string
          p_ticket_definition_id: string
          p_threshold_percent?: number
        }
        Returns: boolean
      }
      log_column_rename: {
        Args: {
          table_name: string
          old_column: string
          new_column: string
          success?: boolean
        }
        Returns: undefined
      }
      log_table_rename: {
        Args: { old_name: string; new_name: string; success?: boolean }
        Returns: undefined
      }
      normalize_event_id: {
        Args: { p_id: string }
        Returns: string
      }
      refresh_event_days: {
        Args: { parent_id_uuid: string }
        Returns: undefined
      }
      release_event_capacity: {
        Args: { p_event_id: string; p_quantity?: number }
        Returns: boolean
      }
      reserve_event_capacity: {
        Args: { p_event_id: string; p_quantity?: number }
        Returns: boolean
      }
      reserve_tickets: {
        Args: {
          p_event_id: string
          p_ticket_definition_id: string
          p_quantity: number
          p_reservation_minutes?: number
        }
        Returns: {
          ticket_id: string
          reservation_id: string
          expires_at: string
        }[]
      }
      reserve_tickets_simple: {
        Args: {
          p_event_id: string
          p_ticket_definition_id: string
          p_quantity: number
          p_reservation_minutes?: number
        }
        Returns: {
          ticket_id: string
          reservation_id: string
          expires_at: string
        }[]
      }
      reserve_tickets_v2: {
        Args: {
          p_event_id: string
          p_ticket_definition_id: string
          p_quantity: number
          p_reservation_minutes?: number
        }
        Returns: {
          ticket_id: string
          reservation_id: string
          expires_at: string
        }[]
      }
      reserve_tickets_v3: {
        Args: {
          p_event_id: string
          p_ticket_definition_id: string
          p_quantity: number
          p_reservation_minutes?: number
        }
        Returns: {
          ticket_id: string
          reservation_id: string
          expires_at: string
        }[]
      }
      safe_rename_column: {
        Args: {
          p_table_name: string
          p_old_column: string
          p_new_column: string
        }
        Returns: undefined
      }
      schedule_reservation_cleanup: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      search_all_lodges: {
        Args: { search_term: string; result_limit?: number }
        Returns: {
          area_type: string | null
          created_at: string
          display_name: string | null
          district: string | null
          grand_lodge_id: string | null
          id: string
          meeting_place: string | null
          name: string
          number: number | null
          state_region: string | null
        }[]
      }
      search_grand_lodges_prioritized: {
        Args: { search_term: string; user_country: string }
        Returns: {
          abbreviation: string | null
          country: string | null
          country_code_iso3: string | null
          created_at: string
          id: string
          name: string
          state_region: string | null
          state_region_code: string | null
        }[]
      }
      show_columns: {
        Args: { table_name: string }
        Returns: {
          column_name: string
          data_type: string
        }[]
      }
      test_reserve_tickets: {
        Args: {
          p_event_id: string
          p_ticket_definition_id: string
          p_quantity: number
        }
        Returns: {
          attendee_id: string | null
          checked_in_at: string | null
          created_at: string
          currency: string | null
          event_id: string
          event_ticket_id: string | null
          id: string | null
          is_partner_ticket: boolean | null
          original_price: number | null
          package_id: string | null
          payment_status: string | null
          price_paid: number
          purchased_at: string | null
          registration_id: string | null
          reservation_expires_at: string | null
          reservation_id: string | null
          seat_info: string | null
          status: string
          ticket_definition_id: string | null
          ticket_id: string
          ticket_price: number | null
          ticket_status: string | null
          ticket_type_id: string | null
          updated_at: string
        }[]
      }
      to_camel_case: {
        Args: { snake_str: string }
        Returns: string
      }
      verify_registration_payment: {
        Args: { reg_id: string }
        Returns: Json
      }
    }
    Enums: {
      attendee_contact_preference:
        | "directly"
        | "primaryattendee"
        | "mason"
        | "guest"
        | "providelater"
      attendee_type: "mason" | "guest" | "ladypartner" | "guestpartner"
      billing_reason:
        | "subscription_cycle"
        | "subscription_create"
        | "subscription_update"
        | "subscription_threshold"
        | "manual"
        | "upcoming"
        | "quote_accept"
      billing_scheme: "per_unit" | "tiered"
      collection_method: "charge_automatically" | "send_invoice"
      invoice_status: "draft" | "open" | "paid" | "void" | "uncollectible"
      organisation_type:
        | "lodge"
        | "grandlodge"
        | "masonicorder"
        | "company"
        | "other"
      payment_status:
        | "pending"
        | "completed"
        | "failed"
        | "refunded"
        | "partially_refunded"
        | "cancelled"
        | "expired"
      price_type: "one_time" | "recurring"
      quote_status: "draft" | "open" | "accepted" | "canceled" | "expired"
      registration_type:
        | "individuals"
        | "groups"
        | "officials"
        | "lodge"
        | "delegation"
      stripe_order_status: "pending" | "completed" | "canceled"
      stripe_subscription_status:
        | "not_started"
        | "incomplete"
        | "incomplete_expired"
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "unpaid"
        | "paused"
      tax_behavior: "inclusive" | "exclusive" | "unspecified"
      URL: "url"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      attendee_contact_preference: [
        "directly",
        "primaryattendee",
        "mason",
        "guest",
        "providelater",
      ],
      attendee_type: ["mason", "guest", "ladypartner", "guestpartner"],
      billing_reason: [
        "subscription_cycle",
        "subscription_create",
        "subscription_update",
        "subscription_threshold",
        "manual",
        "upcoming",
        "quote_accept",
      ],
      billing_scheme: ["per_unit", "tiered"],
      collection_method: ["charge_automatically", "send_invoice"],
      invoice_status: ["draft", "open", "paid", "void", "uncollectible"],
      organisation_type: [
        "lodge",
        "grandlodge",
        "masonicorder",
        "company",
        "other",
      ],
      payment_status: [
        "pending",
        "completed",
        "failed",
        "refunded",
        "partially_refunded",
        "cancelled",
        "expired",
      ],
      price_type: ["one_time", "recurring"],
      quote_status: ["draft", "open", "accepted", "canceled", "expired"],
      registration_type: [
        "individuals",
        "groups",
        "officials",
        "lodge",
        "delegation",
      ],
      stripe_order_status: ["pending", "completed", "canceled"],
      stripe_subscription_status: [
        "not_started",
        "incomplete",
        "incomplete_expired",
        "trialing",
        "active",
        "past_due",
        "canceled",
        "unpaid",
        "paused",
      ],
      tax_behavior: ["inclusive", "exclusive", "unspecified"],
      URL: ["url"],
    },
  },
} as const
