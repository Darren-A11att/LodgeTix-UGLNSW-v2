#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function validateSchema() {
  console.log('🔍 Validating Database Schema...\n');
  
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check RPC Functions
  const requiredRPCs = [
    'check_ticket_availability',
    'complete_payment',
    'create_function_registration',
    'get_event_with_details',
    'get_function_details',
    'get_registration_summary',
    'upsert_individual_registration',
    'upsert_lodge_registration',
    'upsert_delegation_registration'
  ];

  console.log('📋 Checking RPC Functions...');
  const { data: rpcs } = await supabase.rpc('execute_sql', {
    sql: `SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace`
  }).catch(() => ({ data: [] }));

  const existingRPCs = rpcs?.map((r: any) => r.proname) || [];
  
  for (const rpc of requiredRPCs) {
    if (!existingRPCs.includes(rpc)) {
      errors.push(`❌ Missing RPC function: ${rpc}`);
    } else {
      console.log(`✅ RPC function exists: ${rpc}`);
    }
  }

  // Check Views
  const requiredViews = [
    'registration_detail_view',
    'attendee_complete_view',
    'ticket_availability_view',
    'event_hierarchy_view',
    'individuals_registration_complete_view'
  ];

  console.log('\n📋 Checking Views...');
  const { data: views } = await supabase.rpc('execute_sql', {
    sql: `SELECT viewname FROM pg_views WHERE schemaname = 'public'`
  }).catch(() => ({ data: [] }));

  const existingViews = views?.map((v: any) => v.viewname) || [];
  
  for (const view of requiredViews) {
    if (!existingViews.includes(view)) {
      warnings.push(`⚠️  Missing view: ${view}`);
    } else {
      console.log(`✅ View exists: ${view}`);
    }
  }

  // Check Critical Tables
  const criticalTables = [
    'customers',
    'registrations',
    'attendees',
    'tickets',
    'functions',
    'events',
    'raw_registrations'
  ];

  console.log('\n📋 Checking Tables...');
  const { data: tables } = await supabase.rpc('execute_sql', {
    sql: `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
  }).catch(() => ({ data: [] }));

  const existingTables = tables?.map((t: any) => t.tablename) || [];
  
  for (const table of criticalTables) {
    if (!existingTables.includes(table)) {
      errors.push(`❌ Missing table: ${table}`);
    } else {
      console.log(`✅ Table exists: ${table}`);
    }
  }

  // Check Column Consistency
  console.log('\n📋 Checking Column Names...');
  const columnChecks = [
    { table: 'customers', columns: ['address_line1', 'address_line_1'] },
    { table: 'contacts', columns: ['mobile_number', 'phone'] },
    { table: 'raw_registrations', columns: ['raw_id', 'id'] }
  ];

  for (const check of columnChecks) {
    const { data: columns } = await supabase.rpc('execute_sql', {
      sql: `SELECT column_name FROM information_schema.columns WHERE table_name = '${check.table}'`
    }).catch(() => ({ data: [] }));

    const existingColumns = columns?.map((c: any) => c.column_name) || [];
    
    for (const col of check.columns) {
      if (existingColumns.includes(col)) {
        warnings.push(`⚠️  Table ${check.table} has column: ${col} (check for duplicates)`);
      }
    }
  }

  // Summary
  console.log('\n📊 Validation Summary:');
  console.log(`   Errors: ${errors.length}`);
  console.log(`   Warnings: ${warnings.length}`);

  if (errors.length > 0) {
    console.log('\n❌ Critical Errors:');
    errors.forEach(e => console.log(e));
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(w => console.log(w));
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log('\n✅ Schema validation passed!');
  }

  process.exit(errors.length > 0 ? 1 : 0);
}

validateSchema().catch(console.error);