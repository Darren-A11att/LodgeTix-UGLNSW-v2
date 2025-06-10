import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/utils/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { draftId: string } }
) {
  try {
    console.group("💾 Draft Ticket Persistence API");
    
    const { functionId, ticketSelections } = await request.json();
    console.log("Received draft ticket persistence request:", {
      draftId: params.draftId,
      functionId,
      attendeeCount: Object.keys(ticketSelections || {}).length
    });
    
    // Validate required fields
    if (!params.draftId) {
      console.error("Missing draft ID");
      console.groupEnd();
      return NextResponse.json(
        { error: "Draft ID is required" },
        { status: 400 }
      );
    }
    
    if (!functionId) {
      console.error("Missing function ID");
      console.groupEnd();
      return NextResponse.json(
        { error: "Function ID is required" },
        { status: 400 }
      );
    }
    
    if (!ticketSelections || typeof ticketSelections !== 'object') {
      console.error("Invalid ticket selections format");
      console.groupEnd();
      return NextResponse.json(
        { error: "Valid ticket selections object is required" },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Get or create anonymous session (same pattern as lodge registration API)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (!session) {
      const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
      if (anonError) {
        console.error('Failed to create anonymous session:', anonError);
        console.groupEnd();
        return NextResponse.json(
          { error: 'Authentication failed' },
          { status: 401 }
        );
      }
    }
    
    // Get current user after ensuring session exists
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Authentication failed:", authError);
      console.groupEnd();
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }
    
    // For now, we'll store the draft ticket selections in a simple way
    // This is a simplified implementation - in a full system you might want to:
    // 1. Create actual draft ticket records with 'draft' status
    // 2. Update attendee records with the ticket selections
    // 3. Implement draft expiration and cleanup
    
    // Store the draft data in a JSON format that can be easily retrieved
    const draftData = {
      draftId: params.draftId,
      functionId,
      ticketSelections,
      userId: user.id,
      lastUpdated: new Date().toISOString(),
      version: 1
    };
    
    // For this implementation, we'll use the raw_registrations table to store drafts
    // In a production system, you might want a dedicated drafts table
    const { error: insertError } = await supabase
      .from('raw_registrations')
      .insert({
        raw_data: {
          source: 'draft_ticket_persistence',
          timestamp: new Date().toISOString(),
          draft_data: draftData
        },
        registration_id: null, // No registration ID yet for drafts
        registration_type: 'draft_tickets',
        created_at: new Date().toISOString()
      });
    
    if (insertError) {
      console.error("Error storing draft ticket selections:", insertError);
      console.groupEnd();
      return NextResponse.json(
        { error: "Failed to store draft ticket selections" },
        { status: 500 }
      );
    }
    
    console.log("✅ Draft ticket selections stored successfully");
    console.groupEnd();
    
    return NextResponse.json({
      success: true,
      message: "Draft ticket selections saved successfully",
      draftId: params.draftId,
      attendeeCount: Object.keys(ticketSelections).length
    });
    
  } catch (error: any) {
    console.error("Error in draft ticket persistence API:", error);
    console.groupEnd();
    return NextResponse.json(
      { error: `Failed to process draft ticket persistence: ${error.message}` },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to retrieve draft ticket selections
export async function GET(
  request: NextRequest,
  { params }: { params: { draftId: string } }
) {
  try {
    const supabase = await createClient();
    
    // Get or create anonymous session (same pattern as lodge registration API)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (!session) {
      const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
      if (anonError) {
        console.error('Failed to create anonymous session:', anonError);
        return NextResponse.json(
          { error: 'Authentication failed' },
          { status: 401 }
        );
      }
    }
    
    // Get current user after ensuring session exists
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }
    
    // Retrieve draft ticket selections
    const { data, error } = await supabase
      .from('raw_registrations')
      .select('raw_data')
      .eq('registration_type', 'draft_tickets')
      .eq('raw_data->draft_data->draftId', params.draftId)
      .eq('raw_data->draft_data->userId', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) {
      return NextResponse.json(
        { error: "Draft not found" },
        { status: 404 }
      );
    }
    
    const draftData = data.raw_data?.draft_data;
    
    return NextResponse.json({
      success: true,
      draftData: draftData
    });
    
  } catch (error: any) {
    console.error("Error retrieving draft:", error);
    return NextResponse.json(
      { error: `Failed to retrieve draft: ${error.message}` },
      { status: 500 }
    );
  }
}