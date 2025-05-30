import { NextRequest, NextResponse } from 'next/server';
import { getStorageService } from '@/lib/services/storage-service';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { bucket, path, expiresIn = 3600 } = body;
    
    if (!bucket || !path) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Validate bucket name
    const validBuckets = ['ticket-qr-codes', 'confirmations', 'event-images', 'email-templates'];
    if (!validBuckets.includes(bucket)) {
      return NextResponse.json(
        { error: 'Invalid bucket name' },
        { status: 400 }
      );
    }
    
    // For public buckets, return public URL
    if (bucket === 'ticket-qr-codes' || bucket === 'event-images') {
      const storageService = getStorageService();
      const publicUrl = storageService.getPublicUrl(bucket, path);
      return NextResponse.json({ url: publicUrl, type: 'public' });
    }
    
    // For private buckets, generate signed URL
    const storageService = getStorageService();
    const signedUrl = await storageService.getSignedUrl({
      bucket,
      path,
      expiresIn,
    });
    
    if (!signedUrl) {
      return NextResponse.json(
        { error: 'Failed to generate signed URL' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      url: signedUrl, 
      type: 'signed',
      expiresIn 
    });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get('bucket');
    const path = searchParams.get('path');
    const expiresIn = parseInt(searchParams.get('expiresIn') || '3600');
    
    if (!bucket || !path) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Validate bucket name
    const validBuckets = ['ticket-qr-codes', 'confirmations', 'event-images', 'email-templates'];
    if (!validBuckets.includes(bucket)) {
      return NextResponse.json(
        { error: 'Invalid bucket name' },
        { status: 400 }
      );
    }
    
    // For public buckets, return public URL
    if (bucket === 'ticket-qr-codes' || bucket === 'event-images') {
      const storageService = getStorageService();
      const publicUrl = storageService.getPublicUrl(bucket as any, path);
      return NextResponse.json({ url: publicUrl, type: 'public' });
    }
    
    // For private buckets, generate signed URL
    const storageService = getStorageService();
    const signedUrl = await storageService.getSignedUrl({
      bucket: bucket as any,
      path,
      expiresIn,
    });
    
    if (!signedUrl) {
      return NextResponse.json(
        { error: 'Failed to generate signed URL' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      url: signedUrl, 
      type: 'signed',
      expiresIn 
    });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}