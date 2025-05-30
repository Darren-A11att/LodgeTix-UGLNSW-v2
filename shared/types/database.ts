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
      attendee_events: {
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
            referencedRelation: "attendee_complete_view"
            referencedColumns: ["attendee_id"]
          },
          {
            foreignKeyName: "attendee_events_attendee_id_fkey"
            columns: ["attendee_id"]
            isOneToOne: false
            referencedRelation: "attendees"
            referencedColumns: ["attendee_id"]
          },
          {
            foreignKeyName: "attendee_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_display_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "attendee_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
        ]
      }
      attendees: {
        Row: {
          attendee_id: string
          attendee_type: Database["public"]["Enums"]["attendee_type"]
          contact_id: string | null
          contact_preference: Database["public"]["Enums"]["attendee_contact_preference"]
          created_at: string
          dietary_requirements: string | null
          email: string | null
          event_title: string | null
          first_name: string | null
          has_partner: boolean | null
          is_partner: string | null
          is_primary: boolean | null
          last_name: string | null
          person_id: string | null
          phone: string | null
          registration_id: string
          related_attendee_id: string | null
          relationship: string | null
          special_needs: string | null
          suffix: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          attendee_id?: string
          attendee_type: Database["public"]["Enums"]["attendee_type"]
          contact_id?: string | null
          contact_preference: Database["public"]["Enums"]["attendee_contact_preference"]
          created_at?: string
          dietary_requirements?: string | null
          email?: string | null
          event_title?: string | null
          first_name?: string | null
          has_partner?: boolean | null
          is_partner?: string | null
          is_primary?: boolean | null
          last_name?: string | null
          person_id?: string | null
          phone?: string | null
          registration_id: string
          related_attendee_id?: string | null
          relationship?: string | null
          special_needs?: string | null
          suffix?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          attendee_id?: string
          attendee_type?: Database["public"]["Enums"]["attendee_type"]
          contact_id?: string | null
          contact_preference?: Database["public"]["Enums"]["attendee_contact_preference"]
          created_at?: string
          dietary_requirements?: string | null
          email?: string | null
          event_title?: string | null
          first_name?: string | null
          has_partner?: boolean | null
          is_partner?: string | null
          is_primary?: boolean | null
          last_name?: string | null
          person_id?: string | null
          phone?: string | null
          registration_id?: string
          related_attendee_id?: string | null
          relationship?: string | null
          special_needs?: string | null
          suffix?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendees_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "auth_user_customer_view"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "attendees_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "attendees_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registration_detail_view"
            referencedColumns: ["registration_id"]
          },
          {
            foreignKeyName: "attendees_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registration_fee_summary"
            referencedColumns: ["registration_id"]
          },
          {
            foreignKeyName: "attendees_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registration_payments"
            referencedColumns: ["registration_id"]
          },
          {
            foreignKeyName: "attendees_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registration_summary"
            referencedColumns: ["registration_id"]
          },
          {
            foreignKeyName: "attendees_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["registration_id"]
          },
          {
            foreignKeyName: "attendees_related_attendee_id_fkey"
            columns: ["related_attendee_id"]
            isOneToOne: false
            referencedRelation: "attendee_complete_view"
            referencedColumns: ["attendee_id"]
          },
          {
            foreignKeyName: "attendees_related_attendee_id_fkey"
            columns: ["related_attendee_id"]
            isOneToOne: false
            referencedRelation: "attendees"
            referencedColumns: ["attendee_id"]
          },
        ]
      }
      connected_account_payments: {
        Row: {
          amount: number
          connected_account_id: string
          created_at: string | null
          currency: string
          id: string
          payment_intent_id: string
          platform_fee: number | null
          registration_id: string | null
          status: string
        }
        Insert: {
          amount: number
          connected_account_id: string
          created_at?: string | null
          currency: string
          id?: string
          payment_intent_id: string
          platform_fee?: number | null
          registration_id?: string | null
          status: string
        }
        Update: {
          amount?: number
          connected_account_id?: string
          created_at?: string | null
          currency?: string
          id?: string
          payment_intent_id?: string
          platform_fee?: number | null
          registration_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "connected_account_payments_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registration_detail_view"
            referencedColumns: ["registration_id"]
          },
          {
            foreignKeyName: "connected_account_payments_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registration_fee_summary"
            referencedColumns: ["registration_id"]
          },
          {
            foreignKeyName: "connected_account_payments_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registration_payments"
            referencedColumns: ["registration_id"]
          },
          {
            foreignKeyName: "connected_account_payments_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registration_summary"
            referencedColumns: ["registration_id"]
          },
          {
            foreignKeyName: "connected_account_payments_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["registration_id"]
          },
        ]
      }
      contacts: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          auth_user_id: string | null
          billing_city: string | null
          billing_country: string | null
          billing_email: string | null
          billing_organisation_name: string | null
          billing_phone: string | null
          billing_postal_code: string | null
          billing_state: string | null
          billing_street_address: string | null
          business_name: string | null
          contact_id: string
          contact_preference: string | null
          country: string | null
          created_at: string | null
          dietary_requirements: string | null
          email: string
          first_name: string
          has_partner: boolean | null
          is_partner: boolean | null
          last_name: string
          mobile_number: string | null
          organisation_id: string | null
          postcode: string | null
          source_id: string | null
          source_type: string | null
          special_needs: string | null
          state: string | null
          stripe_customer_id: string | null
          suburb_city: string | null
          suffix_1: string | null
          suffix_2: string | null
          suffix_3: string | null
          title: string | null
          type: Database["public"]["Enums"]["contact_type"]
          updated_at: string | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          auth_user_id?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_email?: string | null
          billing_organisation_name?: string | null
          billing_phone?: string | null
          billing_postal_code?: string | null
          billing_state?: string | null
          billing_street_address?: string | null
          business_name?: string | null
          contact_id?: string
          contact_preference?: string | null
          country?: string | null
          created_at?: string | null
          dietary_requirements?: string | null
          email: string
          first_name: string
          has_partner?: boolean | null
          is_partner?: boolean | null
          last_name: string
          mobile_number?: string | null
          organisation_id?: string | null
          postcode?: string | null
          source_id?: string | null
          source_type?: string | null
          special_needs?: string | null
          state?: string | null
          stripe_customer_id?: string | null
          suburb_city?: string | null
          suffix_1?: string | null
          suffix_2?: string | null
          suffix_3?: string | null
          title?: string | null
          type: Database["public"]["Enums"]["contact_type"]
          updated_at?: string | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          auth_user_id?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_email?: string | null
          billing_organisation_name?: string | null
          billing_phone?: string | null
          billing_postal_code?: string | null
          billing_state?: string | null
          billing_street_address?: string | null
          business_name?: string | null
          contact_id?: string
          contact_preference?: string | null
          country?: string | null
          created_at?: string | null
          dietary_requirements?: string | null
          email?: string
          first_name?: string
          has_partner?: boolean | null
          is_partner?: boolean | null
          last_name?: string
          mobile_number?: string | null
          organisation_id?: string | null
          postcode?: string | null
          source_id?: string | null
          source_type?: string | null
          special_needs?: string | null
          state?: string | null
          stripe_customer_id?: string | null
          suburb_city?: string | null
          suffix_1?: string | null
          suffix_2?: string | null
          suffix_3?: string | null
          title?: string | null
          type?: Database["public"]["Enums"]["contact_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["organisation_id"]
          },
        ]
      }
      customers: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          billing_city: string | null
          billing_country: string | null
          billing_email: string | null
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
          customer_id: string
          customer_type: Database["public"]["Enums"]["customer_type"] | null
          email: string | null
          first_name: string | null
          last_name: string | null
          organisation_id: string | null
          phone: string | null
          postal_code: string | null
          state: string | null
          stripe_customer_id: string | null
          updated_at: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_email?: string | null
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
          customer_id: string
          customer_type?: Database["public"]["Enums"]["customer_type"] | null
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          organisation_id?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_email?: string | null
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
          customer_id?: string
          customer_type?: Database["public"]["Enums"]["customer_type"] | null
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          organisation_id?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "auth_user_customer_view"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "customers_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["contact_id"]
          },
        ]
      }
      display_scopes: {
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
      eligibility_criteria: {
        Row: {
          created_at: string
          criteria: string
          id: string
          type: string | null
        }
        Insert: {
          created_at?: string
          criteria: string
          id?: string
          type?: string | null
        }
        Update: {
          created_at?: string
          criteria?: string
          id?: string
          type?: string | null
        }
        Relationships: []
      }
      event_tickets: {
        Row: {
          available_count: number | null
          created_at: string | null
          description: string | null
          eligibility_criteria: Json | null
          event_id: string
          id: string
          is_active: boolean | null
          name: string
          price: number
          reserved_count: number | null
          sold_count: number | null
          status: string | null
          stripe_price_id: string | null
          total_capacity: number | null
          updated_at: string | null
        }
        Insert: {
          available_count?: number | null
          created_at?: string | null
          description?: string | null
          eligibility_criteria?: Json | null
          event_id: string
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          reserved_count?: number | null
          sold_count?: number | null
          status?: string | null
          stripe_price_id?: string | null
          total_capacity?: number | null
          updated_at?: string | null
        }
        Update: {
          available_count?: number | null
          created_at?: string | null
          description?: string | null
          eligibility_criteria?: Json | null
          event_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          reserved_count?: number | null
          sold_count?: number | null
          status?: string | null
          stripe_price_id?: string | null
          total_capacity?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_display_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
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
          event_id: string
          event_includes: string[] | null
          event_start: string | null
          featured: boolean | null
          image_url: string | null
          important_information: string[] | null
          is_multi_day: boolean | null
          is_published: boolean | null
          is_purchasable_individually: boolean | null
          location_id: string | null
          max_attendees: number | null
          organiser_id: string | null
          parent_event_id: string | null
          regalia: string | null
          regalia_description: string | null
          registration_availability_id: string | null
          related_events: string[] | null
          reserved_count: number
          sections: Json | null
          slug: string
          sold_count: number
          stripe_product_id: string | null
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
          event_id?: string
          event_includes?: string[] | null
          event_start?: string | null
          featured?: boolean | null
          image_url?: string | null
          important_information?: string[] | null
          is_multi_day?: boolean | null
          is_published?: boolean | null
          is_purchasable_individually?: boolean | null
          location_id?: string | null
          max_attendees?: number | null
          organiser_id?: string | null
          parent_event_id?: string | null
          regalia?: string | null
          regalia_description?: string | null
          registration_availability_id?: string | null
          related_events?: string[] | null
          reserved_count?: number
          sections?: Json | null
          slug: string
          sold_count?: number
          stripe_product_id?: string | null
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
          event_id?: string
          event_includes?: string[] | null
          event_start?: string | null
          featured?: boolean | null
          image_url?: string | null
          important_information?: string[] | null
          is_multi_day?: boolean | null
          is_published?: boolean | null
          is_purchasable_individually?: boolean | null
          location_id?: string | null
          max_attendees?: number | null
          organiser_id?: string | null
          parent_event_id?: string | null
          regalia?: string | null
          regalia_description?: string | null
          registration_availability_id?: string | null
          related_events?: string[] | null
          reserved_count?: number
          sections?: Json | null
          slug?: string
          sold_count?: number
          stripe_product_id?: string | null
          subtitle?: string | null
          title?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_display_scope_id_fkey"
            columns: ["display_scope_id"]
            isOneToOne: false
            referencedRelation: "display_scopes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_locationid_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "events_organiser_id_fkey"
            columns: ["organiser_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["organisation_id"]
          },
          {
            foreignKeyName: "events_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "event_display_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "events_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "events_registration_availability_id_fkey"
            columns: ["registration_availability_id"]
            isOneToOne: false
            referencedRelation: "eligibility_criteria"
            referencedColumns: ["id"]
          },
        ]
      }
      grand_lodges: {
        Row: {
          abbreviation: string | null
          country: string | null
          country_code_iso3: string | null
          created_at: string
          grand_lodge_id: string
          name: string
          organisation_id: string | null
          state_region: string | null
          state_region_code: string | null
        }
        Insert: {
          abbreviation?: string | null
          country?: string | null
          country_code_iso3?: string | null
          created_at?: string
          grand_lodge_id?: string
          name: string
          organisation_id?: string | null
          state_region?: string | null
          state_region_code?: string | null
        }
        Update: {
          abbreviation?: string | null
          country?: string | null
          country_code_iso3?: string | null
          created_at?: string
          grand_lodge_id?: string
          name?: string
          organisation_id?: string | null
          state_region?: string | null
          state_region_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grand_lodges_organisationid_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["organisation_id"]
          },
        ]
      }
      locations: {
        Row: {
          capacity: number | null
          country: string | null
          created_at: string
          latitude: number | null
          location_id: string
          longitude: number | null
          place_name: string
          postal_code: string | null
          room_or_area: string | null
          state: string | null
          street_address: string | null
          suburb: string | null
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          country?: string | null
          created_at?: string
          latitude?: number | null
          location_id?: string
          longitude?: number | null
          place_name: string
          postal_code?: string | null
          room_or_area?: string | null
          state?: string | null
          street_address?: string | null
          suburb?: string | null
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          country?: string | null
          created_at?: string
          latitude?: number | null
          location_id?: string
          longitude?: number | null
          place_name?: string
          postal_code?: string | null
          room_or_area?: string | null
          state?: string | null
          street_address?: string | null
          suburb?: string | null
          updated_at?: string
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
          lodge_id: string
          meeting_place: string | null
          name: string
          number: number | null
          organisation_id: string | null
          state_region: string | null
        }
        Insert: {
          area_type?: string | null
          created_at?: string
          display_name?: string | null
          district?: string | null
          grand_lodge_id?: string | null
          lodge_id?: string
          meeting_place?: string | null
          name: string
          number?: number | null
          organisation_id?: string | null
          state_region?: string | null
        }
        Update: {
          area_type?: string | null
          created_at?: string
          display_name?: string | null
          district?: string | null
          grand_lodge_id?: string | null
          lodge_id?: string
          meeting_place?: string | null
          name?: string
          number?: number | null
          organisation_id?: string | null
          state_region?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lodges_grand_lodge_id_fkey"
            columns: ["grand_lodge_id"]
            isOneToOne: false
            referencedRelation: "grand_lodges"
            referencedColumns: ["grand_lodge_id"]
          },
          {
            foreignKeyName: "lodges_organisationid_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["organisation_id"]
          },
        ]
      }
      masonic_profiles: {
        Row: {
          contact_id: string | null
          created_at: string
          grand_lodge_id: string | null
          grand_office: string | null
          grand_officer: string | null
          grand_rank: string | null
          lodge_id: string | null
          masonic_profile_id: string
          masonic_title: string | null
          rank: string | null
          updated_at: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          grand_lodge_id?: string | null
          grand_office?: string | null
          grand_officer?: string | null
          grand_rank?: string | null
          lodge_id?: string | null
          masonic_profile_id?: string
          masonic_title?: string | null
          rank?: string | null
          updated_at?: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          grand_lodge_id?: string | null
          grand_office?: string | null
          grand_officer?: string | null
          grand_rank?: string | null
          lodge_id?: string | null
          masonic_profile_id?: string
          masonic_title?: string | null
          rank?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "masonic_profiles_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: true
            referencedRelation: "auth_user_customer_view"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "masonic_profiles_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: true
            referencedRelation: "contacts"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "masonic_profiles_grand_lodge_id_fkey"
            columns: ["grand_lodge_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["organisation_id"]
          },
          {
            foreignKeyName: "masonic_profiles_lodge_id_fkey"
            columns: ["lodge_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["organisation_id"]
          },
        ]
      }
      memberships: {
        Row: {
          contact_id: string
          created_at: string
          is_active: boolean | null
          membership_entity_id: string
          membership_id: string
          membership_type: string
          permissions: string[] | null
          profile_id: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          is_active?: boolean | null
          membership_entity_id: string
          membership_id?: string
          membership_type: string
          permissions?: string[] | null
          profile_id?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          is_active?: boolean | null
          membership_entity_id?: string
          membership_id?: string
          membership_type?: string
          permissions?: string[] | null
          profile_id?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "auth_user_customer_view"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "memberships_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "attendee_complete_view"
            referencedColumns: ["masonic_profile_id"]
          },
          {
            foreignKeyName: "memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "masonic_profiles"
            referencedColumns: ["masonic_profile_id"]
          },
        ]
      }
      organisation_payouts: {
        Row: {
          amount: number
          arrival_date: string
          created_at: string | null
          currency: string
          description: string | null
          id: string
          metadata: Json | null
          method: string | null
          organisation_stripe_id: string
          payout_id: string
          status: string
        }
        Insert: {
          amount: number
          arrival_date: string
          created_at?: string | null
          currency: string
          description?: string | null
          id?: string
          metadata?: Json | null
          method?: string | null
          organisation_stripe_id: string
          payout_id: string
          status: string
        }
        Update: {
          amount?: number
          arrival_date?: string
          created_at?: string | null
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          method?: string | null
          organisation_stripe_id?: string
          payout_id?: string
          status?: string
        }
        Relationships: []
      }
      organisations: {
        Row: {
          abbreviation: string | null
          city: string | null
          country: string | null
          created_at: string
          known_as: string | null
          name: string
          organisation_id: string
          postal_code: string | null
          state: string | null
          street_address: string | null
          stripe_account_status: string | null
          stripe_capabilities: Json | null
          stripe_details_submitted: boolean | null
          stripe_onbehalfof: string | null
          stripe_payouts_enabled: boolean | null
          type: Database["public"]["Enums"]["organisation_type"]
          updated_at: string
          website: string | null
        }
        Insert: {
          abbreviation?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          known_as?: string | null
          name: string
          organisation_id?: string
          postal_code?: string | null
          state?: string | null
          street_address?: string | null
          stripe_account_status?: string | null
          stripe_capabilities?: Json | null
          stripe_details_submitted?: boolean | null
          stripe_onbehalfof?: string | null
          stripe_payouts_enabled?: boolean | null
          type: Database["public"]["Enums"]["organisation_type"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          abbreviation?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          known_as?: string | null
          name?: string
          organisation_id?: string
          postal_code?: string | null
          state?: string | null
          street_address?: string | null
          stripe_account_status?: string | null
          stripe_capabilities?: Json | null
          stripe_details_submitted?: boolean | null
          stripe_onbehalfof?: string | null
          stripe_payouts_enabled?: boolean | null
          type?: Database["public"]["Enums"]["organisation_type"]
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      packages: {
        Row: {
          created_at: string | null
          description: string | null
          discount: number | null
          eligibility_criteria: Json | null
          event_id: string | null
          included_items:
            | Database["public"]["CompositeTypes"]["package_item"][]
            | null
          includes_description: string[] | null
          is_active: boolean | null
          name: string
          original_price: number | null
          package_id: string
          package_price: number
          parent_event_id: string | null
          qty: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          discount?: number | null
          eligibility_criteria?: Json | null
          event_id?: string | null
          included_items?:
            | Database["public"]["CompositeTypes"]["package_item"][]
            | null
          includes_description?: string[] | null
          is_active?: boolean | null
          name: string
          original_price?: number | null
          package_id?: string
          package_price: number
          parent_event_id?: string | null
          qty?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          discount?: number | null
          eligibility_criteria?: Json | null
          event_id?: string | null
          included_items?:
            | Database["public"]["CompositeTypes"]["package_item"][]
            | null
          includes_description?: string[] | null
          is_active?: boolean | null
          name?: string
          original_price?: number | null
          package_id?: string
          package_price?: number
          parent_event_id?: string | null
          qty?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "packages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_display_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "packages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "packages_parent_event_id_fkey1"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "event_display_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "packages_parent_event_id_fkey1"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
        ]
      }
      platform_transfers: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          description: string | null
          destination_account: string
          id: string
          metadata: Json | null
          source_transaction: string | null
          transfer_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency: string
          description?: string | null
          destination_account: string
          id?: string
          metadata?: Json | null
          source_transaction?: string | null
          transfer_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          description?: string | null
          destination_account?: string
          id?: string
          metadata?: Json | null
          source_transaction?: string | null
          transfer_id?: string
        }
        Relationships: []
      }
      registrations: {
        Row: {
          agree_to_terms: boolean | null
          confirmation_number: string | null
          confirmation_pdf_url: string | null
          connected_account_id: string | null
          contact_id: string | null
          created_at: string | null
          event_id: string | null
          includes_processing_fee: boolean | null
          organisation_id: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          platform_fee_amount: number | null
          platform_fee_id: string | null
          primary_attendee_id: string | null
          registration_data: Json | null
          registration_date: string | null
          registration_id: string
          registration_type:
            | Database["public"]["Enums"]["registration_type"]
            | null
          status: string | null
          stripe_fee: number | null
          stripe_payment_intent_id: string | null
          subtotal: number | null
          total_amount_paid: number | null
          total_price_paid: number | null
          updated_at: string | null
        }
        Insert: {
          agree_to_terms?: boolean | null
          confirmation_number?: string | null
          confirmation_pdf_url?: string | null
          connected_account_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          event_id?: string | null
          includes_processing_fee?: boolean | null
          organisation_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          platform_fee_amount?: number | null
          platform_fee_id?: string | null
          primary_attendee_id?: string | null
          registration_data?: Json | null
          registration_date?: string | null
          registration_id: string
          registration_type?:
            | Database["public"]["Enums"]["registration_type"]
            | null
          status?: string | null
          stripe_fee?: number | null
          stripe_payment_intent_id?: string | null
          subtotal?: number | null
          total_amount_paid?: number | null
          total_price_paid?: number | null
          updated_at?: string | null
        }
        Update: {
          agree_to_terms?: boolean | null
          confirmation_number?: string | null
          confirmation_pdf_url?: string | null
          connected_account_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          event_id?: string | null
          includes_processing_fee?: boolean | null
          organisation_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          platform_fee_amount?: number | null
          platform_fee_id?: string | null
          primary_attendee_id?: string | null
          registration_data?: Json | null
          registration_date?: string | null
          registration_id?: string
          registration_type?:
            | Database["public"]["Enums"]["registration_type"]
            | null
          status?: string | null
          stripe_fee?: number | null
          stripe_payment_intent_id?: string | null
          subtotal?: number | null
          total_amount_paid?: number | null
          total_price_paid?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registrations_customer_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "auth_user_customer_view"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "registrations_customer_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "registrations_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["organisation_id"]
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
          id: string | null
          is_partner_ticket: boolean | null
          original_price: number | null
          package_id: string | null
          payment_status: string | null
          price_paid: number
          purchased_at: string | null
          qr_code_url: string | null
          registration_id: string | null
          reservation_expires_at: string | null
          reservation_id: string | null
          seat_info: string | null
          status: string
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
          id?: string | null
          is_partner_ticket?: boolean | null
          original_price?: number | null
          package_id?: string | null
          payment_status?: string | null
          price_paid: number
          purchased_at?: string | null
          qr_code_url?: string | null
          registration_id?: string | null
          reservation_expires_at?: string | null
          reservation_id?: string | null
          seat_info?: string | null
          status?: string
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
          id?: string | null
          is_partner_ticket?: boolean | null
          original_price?: number | null
          package_id?: string | null
          payment_status?: string | null
          price_paid?: number
          purchased_at?: string | null
          qr_code_url?: string | null
          registration_id?: string | null
          reservation_expires_at?: string | null
          reservation_id?: string | null
          seat_info?: string | null
          status?: string
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
            referencedRelation: "attendee_complete_view"
            referencedColumns: ["attendee_id"]
          },
          {
            foreignKeyName: "tickets_attendeeid_fkey"
            columns: ["attendee_id"]
            isOneToOne: false
            referencedRelation: "attendees"
            referencedColumns: ["attendee_id"]
          },
          {
            foreignKeyName: "tickets_eventid_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_display_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "tickets_eventid_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "tickets_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["package_id"]
          },
          {
            foreignKeyName: "tickets_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registration_detail_view"
            referencedColumns: ["registration_id"]
          },
          {
            foreignKeyName: "tickets_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registration_fee_summary"
            referencedColumns: ["registration_id"]
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
            foreignKeyName: "tickets_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "event_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_availability_view"
            referencedColumns: ["ticket_type_id"]
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
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_user_customer_view"
            referencedColumns: ["auth_user_id"]
          },
        ]
      }
    }
    Views: {
      attendee_complete_view: {
        Row: {
          attendee_id: string | null
          attendee_type: Database["public"]["Enums"]["attendee_type"] | null
          confirmation_number: string | null
          contact_address_line_1: string | null
          contact_address_line_2: string | null
          contact_city: string | null
          contact_country: string | null
          contact_id: string | null
          contact_postcode: string | null
          contact_preference:
            | Database["public"]["Enums"]["attendee_contact_preference"]
            | null
          contact_state: string | null
          created_at: string | null
          dietary_requirements: string | null
          email: string | null
          event_end: string | null
          event_id: string | null
          event_slug: string | null
          event_start: string | null
          event_title: string | null
          first_name: string | null
          full_name: string | null
          grand_lodge_abbreviation: string | null
          grand_lodge_id: string | null
          grand_lodge_name: string | null
          grand_office: string | null
          grand_officer: string | null
          grand_rank: string | null
          has_checked_in: boolean | null
          has_partner: boolean | null
          is_partner: string | null
          is_primary: boolean | null
          last_name: string | null
          lodge_abbreviation: string | null
          lodge_id: string | null
          lodge_name: string | null
          lodge_number: number | null
          lodge_type: Database["public"]["Enums"]["organisation_type"] | null
          masonic_profile_id: string | null
          masonic_title: string | null
          partner_first_name: string | null
          partner_full_name: string | null
          partner_last_name: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          phone: string | null
          rank: string | null
          registration_id: string | null
          registration_type:
            | Database["public"]["Enums"]["registration_type"]
            | null
          related_attendee_id: string | null
          relationship: string | null
          special_needs: string | null
          suffix: string | null
          ticket_count: number | null
          tickets: Json[] | null
          title: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendees_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "auth_user_customer_view"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "attendees_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "attendees_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registration_detail_view"
            referencedColumns: ["registration_id"]
          },
          {
            foreignKeyName: "attendees_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registration_fee_summary"
            referencedColumns: ["registration_id"]
          },
          {
            foreignKeyName: "attendees_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registration_payments"
            referencedColumns: ["registration_id"]
          },
          {
            foreignKeyName: "attendees_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registration_summary"
            referencedColumns: ["registration_id"]
          },
          {
            foreignKeyName: "attendees_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["registration_id"]
          },
          {
            foreignKeyName: "attendees_related_attendee_id_fkey"
            columns: ["related_attendee_id"]
            isOneToOne: false
            referencedRelation: "attendee_complete_view"
            referencedColumns: ["attendee_id"]
          },
          {
            foreignKeyName: "attendees_related_attendee_id_fkey"
            columns: ["related_attendee_id"]
            isOneToOne: false
            referencedRelation: "attendees"
            referencedColumns: ["attendee_id"]
          },
          {
            foreignKeyName: "masonic_profiles_grand_lodge_id_fkey"
            columns: ["grand_lodge_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["organisation_id"]
          },
          {
            foreignKeyName: "masonic_profiles_lodge_id_fkey"
            columns: ["lodge_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["organisation_id"]
          },
        ]
      }
      auth_user_customer_view: {
        Row: {
          auth_email: string | null
          auth_user_id: string | null
          contact_email: string | null
          contact_id: string | null
          customer_id: string | null
          customer_type: Database["public"]["Enums"]["customer_type"] | null
          first_name: string | null
          last_name: string | null
          user_created: string | null
          user_type: string | null
        }
        Relationships: []
      }
      event_display_view: {
        Row: {
          attendance: Json | null
          child_event_count: number | null
          created_at: string | null
          degree_type: string | null
          description: string | null
          documents: Json | null
          dress_code: string | null
          event_end: string | null
          event_id: string | null
          event_includes: string[] | null
          event_start: string | null
          featured: boolean | null
          image_url: string | null
          important_information: string[] | null
          is_multi_day: boolean | null
          is_published: boolean | null
          is_purchasable_individually: boolean | null
          is_sold_out: boolean | null
          latitude: number | null
          location_capacity: number | null
          location_id: string | null
          location_string: string | null
          longitude: number | null
          max_attendees: number | null
          min_price: number | null
          organiser_abbreviation: string | null
          organiser_id: string | null
          organiser_name: string | null
          organiser_type:
            | Database["public"]["Enums"]["organisation_type"]
            | null
          parent_event_id: string | null
          parent_event_slug: string | null
          parent_event_title: string | null
          place_name: string | null
          postal_code: string | null
          regalia: string | null
          regalia_description: string | null
          related_events: string[] | null
          reserved_count: number | null
          sections: Json | null
          slug: string | null
          sold_count: number | null
          state: string | null
          street_address: string | null
          subtitle: string | null
          suburb: string | null
          tickets_available: number | null
          tickets_sold: number | null
          title: string | null
          total_capacity: number | null
          type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_locationid_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "events_organiser_id_fkey"
            columns: ["organiser_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["organisation_id"]
          },
          {
            foreignKeyName: "events_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "event_display_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "events_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
        ]
      }
      event_hierarchy_view: {
        Row: {
          children_sold_count: number | null
          children_total_capacity: number | null
          direct_child_count: number | null
          event_end: string | null
          event_id: string | null
          event_start: string | null
          featured: boolean | null
          image_url: string | null
          is_in_package: boolean | null
          is_published: boolean | null
          is_purchasable_individually: boolean | null
          level: number | null
          location_id: string | null
          max_attendees: number | null
          organiser_id: string | null
          packages: Json[] | null
          parent_event_id: string | null
          parent_slug: string | null
          parent_title: string | null
          parent_type: string | null
          path: string[] | null
          path_display: string | null
          reserved_count: number | null
          root_event_id: string | null
          slug: string | null
          sold_count: number | null
          subtitle: string | null
          title: string | null
          total_available_tickets: number | null
          total_descendant_count: number | null
          type: string | null
        }
        Relationships: []
      }
      memberships_view: {
        Row: {
          contact_id: string | null
          created_at: string | null
          email: string | null
          entity_name: string | null
          first_name: string | null
          is_active: boolean | null
          last_name: string | null
          masonic_title: string | null
          membership_entity_id: string | null
          membership_id: string | null
          membership_type: string | null
          permissions: string[] | null
          profile_id: string | null
          role: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memberships_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "auth_user_customer_view"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "memberships_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "attendee_complete_view"
            referencedColumns: ["masonic_profile_id"]
          },
          {
            foreignKeyName: "memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "masonic_profiles"
            referencedColumns: ["masonic_profile_id"]
          },
        ]
      }
      registration_detail_view: {
        Row: {
          agree_to_terms: boolean | null
          attendee_count: number | null
          confirmation_number: string | null
          contact_id: string | null
          created_at: string | null
          customer_email: string | null
          customer_first_name: string | null
          customer_last_name: string | null
          customer_name: string | null
          customer_phone: string | null
          event_end: string | null
          event_id: string | null
          event_slug: string | null
          event_start: string | null
          event_title: string | null
          event_type: string | null
          organisation_abbreviation: string | null
          organisation_id: string | null
          organisation_name: string | null
          partner_count: number | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          primary_attendee_email: string | null
          primary_attendee_first_name: string | null
          primary_attendee_id: string | null
          primary_attendee_last_name: string | null
          registration_data: Json | null
          registration_date: string | null
          registration_id: string | null
          registration_type:
            | Database["public"]["Enums"]["registration_type"]
            | null
          status: string | null
          stripe_payment_intent_id: string | null
          ticket_count: number | null
          ticket_types: string[] | null
          total_amount_paid: number | null
          total_price_paid: number | null
          total_ticket_amount: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registrations_customer_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "auth_user_customer_view"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "registrations_customer_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "registrations_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["organisation_id"]
          },
        ]
      }
      registration_fee_summary: {
        Row: {
          confirmation_number: string | null
          connected_account_id: string | null
          created_at: string | null
          event_title: string | null
          marketplace_fee: number | null
          organization_name: string | null
          organization_receives: number | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          processing_fee: number | null
          registration_id: string | null
          ticket_subtotal: number | null
          total_charged: number | null
        }
        Relationships: []
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
            referencedRelation: "auth_user_customer_view"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "registrations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["contact_id"]
          },
        ]
      }
      ticket_availability_view: {
        Row: {
          active_reservations: number | null
          actual_available: number | null
          available_count: number | null
          created_at: string | null
          description: string | null
          eligibility_criteria: Json | null
          eligibility_rules: Json | null
          event_end: string | null
          event_id: string | null
          event_is_published: boolean | null
          event_slug: string | null
          event_start: string | null
          event_title: string | null
          has_eligibility_requirements: boolean | null
          is_active: boolean | null
          is_sold_out: boolean | null
          percentage_sold: number | null
          price: number | null
          reserved_count: number | null
          sold_count: number | null
          status: string | null
          ticket_category: string | null
          ticket_type_id: string | null
          ticket_type_name: string | null
          total_capacity: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_display_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
        ]
      }
    }
    Functions: {
      calculate_event_pricing: {
        Args: { p_event_ids: string[] }
        Returns: Json
      }
      check_ticket_availability: {
        Args: { p_event_id: string }
        Returns: Json
      }
      check_ticket_eligibility: {
        Args: {
          p_attendee_type: string
          p_rank: string
          p_grand_rank: string
          p_grand_officer: boolean
          p_lodge_id: string
          p_grand_lodge_id: string
          p_registration_type: string
          p_eligibility_rules: Json
        }
        Returns: boolean
      }
      cleanup_expired_reservations: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      complete_payment: {
        Args: { p_registration_id: string; p_payment_intent_id: string }
        Returns: Json
      }
      create_registration_with_attendees: {
        Args: { p_registration_data: Json }
        Returns: Json
      }
      expire_ticket_reservations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      find_missing_indexes: {
        Args: Record<PropertyKey, never>
        Returns: {
          tablename: string
          attname: string
          n_distinct: number
          correlation: number
          null_frac: number
          avg_width: number
          recommendation: string
        }[]
      }
      get_eligible_tickets: {
        Args: { p_event_id: string; p_registration_id: string }
        Returns: Json
      }
      get_event_with_details: {
        Args: { p_event_slug: string }
        Returns: Json
      }
      get_registration_summary: {
        Args: { p_registration_id: string }
        Returns: Json
      }
      initialize_event_ticket_availability: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      monitor_index_usage: {
        Args: Record<PropertyKey, never>
        Returns: {
          schemaname: string
          tablename: string
          indexname: string
          idx_scan: number
          idx_tup_read: number
          idx_tup_fetch: number
          table_size: string
          index_size: string
          usage_ratio: number
        }[]
      }
      recalculate_event_counts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      recalculate_event_ticket_counts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      reserve_tickets: {
        Args: { p_ticket_selections: Json }
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
      contact_type: "individual" | "organisation"
      customer_type: "booking_contact" | "sponsor" | "donor"
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
        | "Unpaid"
        | "unpaid"
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
      package_item: {
        event_ticket_id: string | null
        quantity: number | null
      }
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
      contact_type: ["individual", "organisation"],
      customer_type: ["booking_contact", "sponsor", "donor"],
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
        "Unpaid",
        "unpaid",
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
