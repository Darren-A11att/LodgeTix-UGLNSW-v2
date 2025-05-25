#!/usr/bin/env node

/**
 * Analyze duplicate tables in Supabase database
 * This script runs SQL queries to understand the current schema situation
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runAnalysis() {
  console.log('🔍 Starting database schema analysis...\n');

  const results: any = {
    timestamp: new Date().toISOString(),
    findings: {}
  };

  try {
    // 1. List tables
    console.log('1️⃣ Checking for duplicate tables...');
    const { data: tables, error: tablesError } = await supabase.rpc('get_table_info', {
      table_names: ['registrations', 'Registrations', 'tickets', 'Tickets']
    }).single();

    if (tablesError) {
      // If RPC doesn't exist, use direct query
      const { data: tableList, error: tableListError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .in('table_name', ['registrations', 'Registrations', 'tickets', 'Tickets'])
        .eq('table_schema', 'public');

      if (!tableListError && tableList) {
        results.findings.tables = tableList;
        console.log(`   Found tables: ${tableList.map(t => t.table_name).join(', ')}`);
      }
    } else {
      results.findings.tables = tables;
    }

    // 2. Count rows in each table
    console.log('\n2️⃣ Counting rows in each table...');
    
    // Check registrations
    const { count: regCount } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true });
    console.log(`   registrations: ${regCount || 0} rows`);
    
    const { count: RegCount } = await supabase
      .from('Registrations')
      .select('*', { count: 'exact', head: true });
    console.log(`   Registrations: ${RegCount || 0} rows`);
    
    // Check tickets
    const { count: tickCount } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true });
    console.log(`   tickets: ${tickCount || 0} rows`);
    
    const { count: TickCount } = await supabase
      .from('Tickets')
      .select('*', { count: 'exact', head: true });
    console.log(`   Tickets: ${TickCount || 0} rows`);

    results.findings.rowCounts = {
      registrations: regCount || 0,
      Registrations: RegCount || 0,
      tickets: tickCount || 0,
      Tickets: TickCount || 0
    };

    // 3. Get sample data from each table
    console.log('\n3️⃣ Getting sample data from each table...');
    
    const { data: regSample } = await supabase
      .from('registrations')
      .select('*')
      .limit(1);
    
    const { data: RegSample } = await supabase
      .from('Registrations')
      .select('*')
      .limit(1);
    
    const { data: tickSample } = await supabase
      .from('tickets')
      .select('*')
      .limit(1);
    
    const { data: TickSample } = await supabase
      .from('Tickets')
      .select('*')
      .limit(1);

    results.findings.sampleData = {
      registrations: regSample?.[0] || null,
      Registrations: RegSample?.[0] || null,
      tickets: tickSample?.[0] || null,
      Tickets: TickSample?.[0] || null
    };

    // 4. Analyze column differences
    console.log('\n4️⃣ Analyzing column differences...');
    
    if (regSample?.[0] && RegSample?.[0]) {
      const regCols = Object.keys(regSample[0]);
      const RegCols = Object.keys(RegSample[0]);
      
      const regOnly = regCols.filter(col => !RegCols.includes(col));
      const RegOnly = RegCols.filter(col => !regCols.includes(col));
      const common = regCols.filter(col => RegCols.includes(col));
      
      console.log(`   registrations columns: ${regCols.length}`);
      console.log(`   Registrations columns: ${RegCols.length}`);
      console.log(`   Common columns: ${common.length}`);
      if (regOnly.length > 0) console.log(`   Only in registrations: ${regOnly.join(', ')}`);
      if (RegOnly.length > 0) console.log(`   Only in Registrations: ${RegOnly.join(', ')}`);
      
      results.findings.columnAnalysis = {
        registrations: { total: regCols.length, unique: regOnly },
        Registrations: { total: RegCols.length, unique: RegOnly },
        common: common
      };
    }

    if (tickSample?.[0] && TickSample?.[0]) {
      const tickCols = Object.keys(tickSample[0]);
      const TickCols = Object.keys(TickSample[0]);
      
      const tickOnly = tickCols.filter(col => !TickCols.includes(col));
      const TickOnly = TickCols.filter(col => !tickCols.includes(col));
      const commonTick = tickCols.filter(col => TickCols.includes(col));
      
      console.log(`\n   tickets columns: ${tickCols.length}`);
      console.log(`   Tickets columns: ${TickCols.length}`);
      console.log(`   Common columns: ${commonTick.length}`);
      if (tickOnly.length > 0) console.log(`   Only in tickets: ${tickOnly.join(', ')}`);
      if (TickOnly.length > 0) console.log(`   Only in Tickets: ${TickOnly.join(', ')}`);
      
      results.findings.ticketColumnAnalysis = {
        tickets: { total: tickCols.length, unique: tickOnly },
        Tickets: { total: TickCols.length, unique: TickOnly },
        common: commonTick
      };
    }

    // 5. Check for foreign key references
    console.log('\n5️⃣ Checking for tables that reference these tables...');
    
    // This would require a more complex query or RPC function
    // For now, we'll note it as a manual check requirement
    console.log('   Note: Foreign key analysis requires manual SQL execution');
    
    // Save results to file
    const outputPath = path.join(process.cwd(), 'scripts', 'duplicate-tables-analysis.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\n✅ Analysis complete! Results saved to: ${outputPath}`);
    
    // Print summary
    console.log('\n📊 Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Duplicate tables found:`);
    console.log(`- registrations (${regCount || 0} rows) & Registrations (${RegCount || 0} rows)`);
    console.log(`- tickets (${tickCount || 0} rows) & Tickets (${TickCount || 0} rows)`);
    
    if ((regCount || 0) > 0 && (RegCount || 0) > 0) {
      console.log('\n⚠️  WARNING: Both registration tables contain data!');
      console.log('   This could lead to data inconsistency issues.');
    }
    
    if ((tickCount || 0) > 0 && (TickCount || 0) > 0) {
      console.log('\n⚠️  WARNING: Both ticket tables contain data!');
      console.log('   This could lead to data inconsistency issues.');
    }
    
    console.log('\n💡 Recommendation: Run the full SQL analysis script for complete details.');
    console.log('   File: scripts/export-full-schema.sql');

  } catch (error) {
    console.error('\n❌ Error during analysis:', error);
    results.error = error;
  }
}

// Run the analysis
runAnalysis().catch(console.error);