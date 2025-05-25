#!/usr/bin/env python3
import os
import sys
from supabase import create_client, Client

def get_supabase_client():
    """Create and return a Supabase client."""
    url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL', 'https://pwwpcjbbxotmiqrisjvf.supabase.co')
    anon_key = os.environ.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    service_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
    
    key = anon_key or service_key
    
    if not key:
        print("Error: No Supabase key found in environment variables")
        print("Please set either NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY")
        sys.exit(1)
    
    return create_client(url, key)

def find_relevant_tables(supabase: Client):
    """Find all tables containing ticket, package, seat, table, or venue in their names."""
    query = """
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND (
        table_name ILIKE '%ticket%' 
        OR table_name ILIKE '%package%' 
        OR table_name ILIKE '%seat%' 
        OR table_name ILIKE '%table%' 
        OR table_name ILIKE '%venue%'
    )
    ORDER BY table_name;
    """
    
    try:
        # Try direct query first
        result = supabase.table('information_schema.tables').select('table_name').eq('table_schema', 'public').execute()
        tables = [t['table_name'] for t in result.data if any(keyword in t['table_name'].lower() for keyword in ['ticket', 'package', 'seat', 'table', 'venue'])]
        return tables
    except:
        # If that fails, let's try a different approach - list known tables
        print("Checking known tables...")
        known_tables = [
            'tickets', 'Tickets', 'ticket_definitions', 'TicketDefinitions',
            'packages', 'Packages', 'event_packages', 'EventPackages',
            'seats', 'Seats', 'seating', 'Seating',
            'tables', 'Tables', 'table_bookings', 'TableBookings',
            'venues', 'Venues', 'venue_layouts', 'VenueLayouts'
        ]
        
        existing_tables = []
        for table in known_tables:
            try:
                # Try to query the table
                result = supabase.table(table).select('*').limit(0).execute()
                existing_tables.append(table)
                print(f"✓ Found table: {table}")
            except Exception as e:
                if 'relation' not in str(e).lower():
                    print(f"✗ Table not found: {table}")
        
        return existing_tables

def get_table_schema(supabase: Client, table_name: str):
    """Get the complete schema for a specific table."""
    print(f"\n{'='*60}")
    print(f"Schema for table: {table_name}")
    print('='*60)
    
    try:
        # Get a sample row to understand the structure
        result = supabase.table(table_name).select('*').limit(1).execute()
        
        if result.data and len(result.data) > 0:
            sample = result.data[0]
            print("\nColumns found:")
            for col, val in sample.items():
                val_type = type(val).__name__ if val is not None else 'unknown'
                print(f"  - {col}: {val_type}")
        else:
            # Try to at least get column names
            result = supabase.table(table_name).select('*').limit(0).execute()
            print("\nTable exists but no data found to analyze schema")
            
    except Exception as e:
        print(f"Error accessing table {table_name}: {str(e)}")

def main():
    print("Checking Supabase database schema for ticket-related tables...")
    print(f"Project ID: pwwpcjbbxotmiqrisjvf")
    print()
    
    supabase = get_supabase_client()
    
    # Find relevant tables
    tables = find_relevant_tables(supabase)
    
    if not tables:
        print("No relevant tables found!")
        return
    
    print(f"\nFound {len(tables)} relevant tables:")
    for table in tables:
        print(f"  - {table}")
    
    # Get schema for each table
    for table in tables:
        get_table_schema(supabase, table)

if __name__ == "__main__":
    main()