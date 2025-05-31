import { createClient } from '@/utils/supabase/server';
import type { Database } from '@/shared/types/database';

export type AboutContent = {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  section: string;
  order: number;
  created_at: string;
  updated_at: string;
};

export type AboutFeature = {
  id: string;
  title: string;
  description: string;
  icon: string;
  order: number;
};

export type AboutValue = {
  id: string;
  title: string;
  description: string;
  order: number;
};

/**
 * Fetch about page sections from Supabase
 */
export async function getAboutContent(): Promise<AboutContent[]> {
  // This function assumes a 'content' table exists
  // If it doesn't exist, you would need to create it first
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('content')
      .select('*')
      .eq('page', 'about')
      .order('order');

    if (error) {
      // During build or when table doesn't exist, return empty array silently
      if (error.code === '42P01') {
        // Table doesn't exist - this is expected during build
        return [];
      }
      console.error('Error fetching about content:', error);
      return [];
    }

    return data as AboutContent[];
  } catch (error) {
    console.error('Exception fetching about content:', error);
    return [];
  }
}

/**
 * Fetch about page features from Supabase
 */
export async function getAboutFeatures(): Promise<AboutFeature[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('content_features')
      .select('*')
      .eq('page', 'about')
      .order('order');

    if (error) {
      // During build or when table doesn't exist, return empty array silently
      if (error.code === '42P01') {
        // Table doesn't exist - this is expected during build
        return [];
      }
      console.error('Error fetching about features:', error);
      return [];
    }

    return data as AboutFeature[];
  } catch (error) {
    console.error('Exception fetching about features:', error);
    return [];
  }
}

/**
 * Fetch about page values from Supabase
 */
export async function getAboutValues(): Promise<AboutValue[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('content_values')
      .select('*')
      .eq('page', 'about')
      .order('order');

    if (error) {
      // During build or when table doesn't exist, return empty array silently
      if (error.code === '42P01') {
        // Table doesn't exist - this is expected during build
        return [];
      }
      console.error('Error fetching about values:', error);
      return [];
    }

    return data as AboutValue[];
  } catch (error) {
    console.error('Exception fetching about values:', error);
    return [];
  }
}