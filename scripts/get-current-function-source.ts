#!/usr/bin/env node

/**
 * Get the current function source from the database to see what version we actually have
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pwwpcjbbxotmiqrisjvf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3d3BjamJieG90bWlxcmlzanZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTU0ODU2OCwiZXhwIjoyMDYxMTI0NTY4fQ.pJ3CEbhkGpWX8mYL-AyJKahsZywuRz6PkQmnNuLYsZk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getCurrentFunction() {
  try {
    console.log('🔍 Getting current function source from database...');
    
    // Get the function source code
    const { data, error } = await supabase
      .from('pg_proc')
      .select('proname, prosrc, proargtypes, prorettype')
      .eq('proname', 'upsert_individual_registration');
    
    if (error) {
      console.error('❌ Error getting function:', error);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('❌ Function not found');
      return;
    }
    
    console.log(`✅ Found ${data.length} function(s) with name upsert_individual_registration:`);
    
    data.forEach((func, index) => {
      console.log(`\n--- Function ${index + 1} ---`);
      console.log(`Name: ${func.proname}`);
      console.log(`Arg Types: ${func.proargtypes}`);
      console.log(`Return Type: ${func.prorettype}`);
      
      // Look for the problematic jsonb syntax in the source
      const source = func.prosrc;
      const lines = source.split('\n');
      
      console.log('\n🔍 Searching for problematic jsonb syntax...');
      let foundIssues = 0;
      
      lines.forEach((line, lineNum) => {
        // Look for patterns that might cause "operator does not exist: jsonb ->> jsonb"
        if (line.includes('->>') && line.includes('jsonb')) {
          console.log(`⚠️  Line ${lineNum + 1}: ${line.trim()}`);
          foundIssues++;
        }
        
        // Look for other potential issues
        if (line.includes('->') && line.includes('->') && line.includes('->>')) {
          console.log(`🔍 Potential issue at line ${lineNum + 1}: ${line.trim()}`);
          foundIssues++;
        }
      });
      
      if (foundIssues === 0) {
        console.log('✅ No obvious jsonb syntax issues found');
      } else {
        console.log(`❌ Found ${foundIssues} potential syntax issues`);
      }
      
      // Check if the function has our expected fixes
      const hasCorrectSyntax = source.includes('v_attendee_ticket_map := jsonb_set(');
      console.log(`Has expected v_attendee_ticket_map syntax: ${hasCorrectSyntax ? '✅' : '❌'}`);
      
      const hasNullRelationships = source.includes('NULL, -- Always NULL - no relationship validation');
      console.log(`Has NULL relationship fix: ${hasNullRelationships ? '✅' : '❌'}`);
    });
    
  } catch (error: any) {
    console.error('💥 Failed to get function source:', error.message);
  }
}

getCurrentFunction();