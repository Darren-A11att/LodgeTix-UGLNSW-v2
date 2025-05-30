// Location-related types for Grand Lodge and Lodge selection
export interface GrandLodgeRow {
  grand_lodge_id: string;
  name: string;
  country: string;
  state_province: string | null;
  abbreviation: string;
  website_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface LodgeRow {
  lodge_id: string;
  grand_lodge_id: string;
  name: string;
  number: number | null;
  district: string | null;
  meeting_place: string | null;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export interface UserLocation {
  country: string;
  state?: string;
  city?: string;
}