import { createClient } from "@supabase/supabase-js"
import type { GrandLodge, Lodge, CreateLodgeData } from "@/lib/types/masonic-types"

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Search for Grand Lodges with prioritization
 * This uses the existing search_grand_lodges_prioritized function in your database
 */
export async function searchGrandLodges(searchTerm: string, userCountry: string = 'Australia'): Promise<GrandLodge[]> {
  try {
    const { data, error } = await supabase
      .rpc('search_grand_lodges_prioritized', {
        search_term: searchTerm,
        user_country: userCountry
      })

    if (error) {
      console.error("Error searching Grand Lodges:", error)
      throw error
    }

    return data || []
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
      .eq("id", id)
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
      .eq("id", id)
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
      .from("MasonicProfiles")
      .select("masonicprofileid")
      .eq("person_id", data.person_id)
      .maybeSingle()
    
    if (existingProfile) {
      // Update existing profile
      const { data: updatedProfile, error } = await supabase
        .from("MasonicProfiles")
        .update({
          masonictitle: data.masonictitle,
          rank: data.rank,
          grandrank: data.grandrank || null,
          grandofficer: data.grandofficer || null,
          grandoffice: data.grandoffice || null,
          lodgeid: data.lodgeid || null,
          updatedat: new Date().toISOString()
        })
        .eq("masonicprofileid", existingProfile.masonicprofileid)
        .select("masonicprofileid")
        .single()
      
      if (error) {
        console.error("Error updating Masonic Profile:", error)
        throw error
      }
      
      return { id: updatedProfile.masonicprofileid }
    } else {
      // Create new profile
      const { data: newProfile, error } = await supabase
        .from("MasonicProfiles")
        .insert({
          masonictitle: data.masonictitle,
          rank: data.rank,
          grandrank: data.grandrank || null,
          grandofficer: data.grandofficer || null,
          grandoffice: data.grandoffice || null,
          lodgeid: data.lodgeid || null,
          person_id: data.person_id
        })
        .select("masonicprofileid")
        .single()
      
      if (error) {
        console.error("Error creating Masonic Profile:", error)
        throw error
      }
      
      return { id: newProfile.masonicprofileid }
    }
  } catch (error) {
    console.error("Error in saveMasonicProfile:", error)
    return null
  }
}
