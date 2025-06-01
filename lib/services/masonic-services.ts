import { supabase } from "@/lib/supabase"
import type { GrandLodge, Lodge, CreateLodgeData } from "@/lib/types/masonic-types"

/**
 * Search for Grand Lodges with prioritization
 * Queries the grand_lodges table directly with country-based prioritization
 */
export async function searchGrandLodges(searchTerm: string, userCountry: string = 'Australia'): Promise<GrandLodge[]> {
  try {
    // Build search query with prioritization
    const searchQuery = searchTerm.toLowerCase()
    
    const { data, error } = await supabase
      .from("grand_lodges")
      .select("*")
      .or(`name.ilike.%${searchQuery}%,abbreviation.ilike.%${searchQuery}%,country.ilike.%${searchQuery}%`)
      .order('country', { ascending: false, nullsFirst: false }) // Sort by country to prioritize
      .limit(50)

    if (error) {
      console.error("Error searching Grand Lodges:", error)
      throw error
    }

    // Sort results to prioritize user's country
    const sortedData = data?.sort((a, b) => {
      // Prioritize exact country match
      if (a.country === userCountry && b.country !== userCountry) return -1
      if (b.country === userCountry && a.country !== userCountry) return 1
      
      // Then prioritize by name match
      const aNameMatch = a.name.toLowerCase().includes(searchQuery)
      const bNameMatch = b.name.toLowerCase().includes(searchQuery)
      if (aNameMatch && !bNameMatch) return -1
      if (!aNameMatch && bNameMatch) return 1
      
      // Finally sort alphabetically
      return a.name.localeCompare(b.name)
    }) || []

    return sortedData
  } catch (error) {
    console.error("Error in searchGrandLodges:", error)
    return []
  }
}

/**
 * Fetches all Grand Lodges
 */
export async function getAllGrandLodges(): Promise<GrandLodge[]> {
  try {
    const { data, error } = await supabase
      .from("grand_lodges")
      .select("*")
      .order("name", { ascending: true })

    if (error) {
      console.error("Error fetching all Grand Lodges:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Error in getAllGrandLodges:", error)
    return []
  }
}

/**
 * Search for Lodges using the existing search_all_lodges function
 */
export async function searchLodges(searchTerm: string, limit: number = 20): Promise<Lodge[]> {
  try {
    const { data, error } = await supabase
      .rpc('search_all_lodges', {
        search_term: searchTerm,
        result_limit: limit
      })

    if (error) {
      console.error("Error searching Lodges:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Error in searchLodges:", error)
    return []
  }
}

/**
 * Search for Lodges by Grand Lodge ID
 */
export async function searchLodgesByGrandLodge(searchTerm: string, grandLodgeId: string): Promise<Lodge[]> {
  try {
    const { data, error } = await supabase
      .from("lodges")
      .select("*")
      .eq("grand_lodge_id", grandLodgeId)
      .or(`name.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%,number::text.ilike.%${searchTerm}%`)
      .order("display_name", { ascending: true })
      .limit(20)

    if (error) {
      console.error("Error searching Lodges by Grand Lodge:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Error in searchLodgesByGrandLodge:", error)
    return []
  }
}

/**
 * Creates a new Lodge in the database
 */
export async function createLodge(data: CreateLodgeData): Promise<Lodge | null> {
  try {
    // Generate a display name if one wasn't provided
    const displayName = data.display_name || 
      (data.number ? `${data.name} No. ${data.number}` : data.name)

    const { data: newLodge, error } = await supabase
      .from("lodges")
      .insert({
        name: data.name,
        number: data.number,
        display_name: displayName,
        grand_lodge_id: data.grand_lodge_id,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating Lodge:", error)
      throw error
    }

    return newLodge
  } catch (error) {
    console.error("Error in createLodge:", error)
    return null
  }
}

/**
 * Gets a specific Lodge by ID
 */
export async function getLodgeById(id: string): Promise<Lodge | null> {
  try {
    const { data, error } = await supabase
      .from("lodges")
      .select("*, grand_lodges(*)")
      .eq("lodge_id", id)
      .single()

    if (error) {
      console.error("Error fetching Lodge by ID:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getLodgeById:", error)
    return null
  }
}

/**
 * Gets a specific Grand Lodge by ID
 */
export async function getGrandLodgeById(id: string): Promise<GrandLodge | null> {
  try {
    const { data, error } = await supabase
      .from("grand_lodges")
      .select("*")
      .eq("grand_lodge_id", id)
      .single()

    if (error) {
      console.error("Error fetching Grand Lodge by ID:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getGrandLodgeById:", error)
    return null
  }
}

/**
 * Save a Masonic Profile
 */
export async function saveMasonicProfile(data: {
  masonictitle: string;
  rank: string;
  grandrank?: string;
  grandofficer?: string;
  grandoffice?: string;
  lodgeid?: string;
  person_id: string;
}): Promise<{ id: string } | null> {
  try {
    // Check if profile already exists for this person
    const { data: existingProfile } = await supabase
      .from("masonic_profiles")
      .select("masonic_profile_id")
      .eq("contact_id", data.person_id)
      .maybeSingle()
    
    if (existingProfile) {
      // Update existing profile
      const { data: updatedProfile, error } = await supabase
        .from("masonic_profiles")
        .update({
          masonic_title: data.masonictitle,
          rank: data.rank,
          grand_rank: data.grandrank || null,
          grand_officer: data.grandofficer || null,
          grand_office: data.grandoffice || null,
          lodge_id: data.lodgeid || null,
          updated_at: new Date().toISOString()
        })
        .eq("masonic_profile_id", existingProfile.masonic_profile_id)
        .select("masonic_profile_id")
        .single()
      
      if (error) {
        console.error("Error updating Masonic Profile:", error)
        throw error
      }
      
      return { id: updatedProfile.masonic_profile_id }
    } else {
      // Create new profile
      const { data: newProfile, error } = await supabase
        .from("masonic_profiles")
        .insert({
          masonic_title: data.masonictitle,
          rank: data.rank,
          grand_rank: data.grandrank || null,
          grand_officer: data.grandofficer || null,
          grand_office: data.grandoffice || null,
          lodge_id: data.lodgeid || null,
          contact_id: data.person_id
        })
        .select("masonic_profile_id")
        .single()
      
      if (error) {
        console.error("Error creating Masonic Profile:", error)
        throw error
      }
      
      return { id: newProfile.masonic_profile_id }
    }
  } catch (error) {
    console.error("Error in saveMasonicProfile:", error)
    return null
  }
}
