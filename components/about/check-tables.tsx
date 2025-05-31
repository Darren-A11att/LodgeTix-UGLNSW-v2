'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

export function ContentTablesChecker() {
  const [results, setResults] = useState<{
    [key: string]: { exists: boolean; error?: string; count?: number };
  }>({});
  const [loading, setLoading] = useState(false);

  const checkTables = async () => {
    setLoading(true);
    // Check actual tables that exist in the system
    const tables = [
      'events', 
      'tickets', 
      'registrations', 
      'attendees', 
      'customers',
      'packages',
      'organisations',
      'grand_lodges',
      'lodges'
    ];
    const results: Record<string, any> = {};

    for (const table of tables) {
      try {
        // Try to count rows in the table
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          // Handle specific error types
          if (error.code === '42P01') {
            results[table] = { exists: false, error: 'Table does not exist' };
          } else {
            results[table] = { exists: false, error: error.message };
          }
        } else {
          results[table] = { exists: true, count };
        }
      } catch (error: any) {
        results[table] = { exists: false, error: error.message || 'Unknown error' };
      }
    }

    setResults(results);
    setLoading(false);
  };

  useEffect(() => {
    checkTables();
  }, []);

  return (
    <div className="mb-6 rounded-lg border p-4">
      <h2 className="mb-4 text-xl font-bold">Database Tables Status</h2>
      
      {loading ? (
        <p>Checking tables...</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(results).map(([table, result]) => (
            <div key={table} className="flex items-center justify-between rounded border p-2">
              <div>
                <span className="font-medium">{table}: </span>
                {result.exists ? (
                  <span className="text-green-600">Exists ({result.count} rows)</span>
                ) : (
                  <span className="text-red-600">Missing</span>
                )}
              </div>
              {!result.exists && (
                <div className="text-sm text-gray-500">
                  Error: {result.error}
                </div>
              )}
            </div>
          ))}
          
          <div className="mt-4">
            <Button onClick={checkTables} disabled={loading}>
              Refresh Status
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}