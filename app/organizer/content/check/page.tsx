'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ContentTablesChecker } from '@/components/about/check-tables';
import { supabase } from '@/lib/supabase';

export default function ContentTablesCheckPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [createResult, setCreateResult] = useState<{success?: boolean; message?: string}>({});

  // Function to create the tables
  const createTables = async () => {
    setIsCreating(true);
    setCreateResult({});

    try {
      // Create content table
      const { error: error1 } = await supabase.rpc('execute_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS content (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            page TEXT NOT NULL,
            section TEXT NOT NULL,
            title TEXT NOT NULL,
            subtitle TEXT,
            description TEXT NOT NULL,
            order INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
        `
      });

      if (error1) throw new Error(`Error creating content table: ${error1.message}`);

      // Create content_features table
      const { error: error2 } = await supabase.rpc('execute_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS content_features (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            page TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            icon TEXT NOT NULL,
            order INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
        `
      });

      if (error2) throw new Error(`Error creating content_features table: ${error2.message}`);

      // Create content_values table
      const { error: error3 } = await supabase.rpc('execute_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS content_values (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            page TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            order INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
        `
      });

      if (error3) throw new Error(`Error creating content_values table: ${error3.message}`);

      // Insert initial data
      const { error: error4 } = await supabase.rpc('execute_sql', {
        sql: `
          -- Insert initial content for the about page
          INSERT INTO content (page, section, title, subtitle, description, order)
          VALUES 
          ('about', 'mission', 'Our Mission', NULL, 'LodgeTix was founded with a simple mission: to make Masonic event management easier and more accessible for Lodges of all sizes. We understand the unique needs of Masonic organizations and have built our platform specifically to address those needs.', 1),
          ('about', 'history', 'Created By Freemasons', NULL, 'As active Freemasons ourselves, we''ve experienced firsthand the challenges of organizing Lodge meetings, degree ceremonies, installations, and social events. We''ve built LodgeTix to solve the problems we encountered, creating a platform that respects Masonic traditions while embracing modern technology.', 2)
          ON CONFLICT DO NOTHING;

          -- Insert values
          INSERT INTO content_values (page, title, description, order)
          VALUES
          ('about', 'Brotherly Love', 'We believe in fostering connections between Brethren across different Lodges and jurisdictions.', 1),
          ('about', 'Relief', 'We aim to relieve the administrative burden on Lodge Secretaries and event organizers.', 2),
          ('about', 'Truth', 'We operate with transparency and integrity in all our business practices.', 3)
          ON CONFLICT DO NOTHING;

          -- Insert features
          INSERT INTO content_features (page, title, description, icon, order)
          VALUES
          ('about', 'Masonic-Specific Event Types', 'Create events specifically for Lodge meetings, degree ceremonies, installations, and festive boards with fields tailored to Masonic needs.', 'shield', 1),
          ('about', 'Privacy Controls', 'Control who can see your events with options for public events, members-only events, and private events.', 'layout-grid', 2),
          ('about', 'Visitor Management', 'Easily manage visiting Brethren with special ticket types and the ability to collect Lodge information.', 'users', 3)
          ON CONFLICT DO NOTHING;
        `
      });

      if (error4) throw new Error(`Error inserting initial data: ${error4.message}`);

      setCreateResult({
        success: true,
        message: 'Content tables created successfully!'
      });
    } catch (error: any) {
      console.error('Error creating tables:', error);
      setCreateResult({
        success: false,
        message: error.message
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Content Tables Check</h1>
        <div className="space-x-2">
          <Button asChild variant="outline">
            <Link href="/organizer/content">Content Management</Link>
          </Button>
          <Button asChild>
            <Link href="/organizer/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>

      <ContentTablesChecker />

      <div className="rounded-lg border p-4">
        <h2 className="mb-4 text-xl font-bold">Create Content Tables</h2>
        <p className="mb-4">
          If the tables don't exist, you can create them by clicking the button below.
          This will create the necessary tables and seed them with initial data.
        </p>

        <div className="mb-4">
          <Button 
            onClick={createTables} 
            disabled={isCreating}
            className="bg-blue-700 hover:bg-blue-800"
          >
            {isCreating ? 'Creating Tables...' : 'Create Content Tables'}
          </Button>
        </div>

        {createResult.message && (
          <div className={`mt-4 rounded-lg p-3 ${createResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {createResult.message}
          </div>
        )}
      </div>

      <div className="mt-8 rounded-lg border p-4">
        <h2 className="mb-4 text-xl font-bold">Next Steps</h2>
        <p>After creating the content tables:</p>
        <ol className="ml-6 list-decimal space-y-2">
          <li>Visit the <Link href="/organizer/content" className="text-blue-600 underline">Content Management</Link> page to manage content</li>
          <li>Check the <Link href="/about" className="text-blue-600 underline">About Page</Link> to see the dynamic content in action</li>
        </ol>
      </div>
    </div>
  );
}