import { NextRequest, NextResponse } from 'next/server';
import { getStorageCleanupService } from '@/lib/services/storage-cleanup-service';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (!userRole || userRole.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { type = 'policy' } = body; // 'policy' or 'orphaned'
    
    const cleanupService = getStorageCleanupService();
    
    if (type === 'orphaned') {
      const deletedCount = await cleanupService.cleanupOrphanedFiles();
      
      return NextResponse.json({
        success: true,
        type: 'orphaned',
        deletedCount,
        message: `Deleted ${deletedCount} orphaned files`,
      });
    } else {
      const results = await cleanupService.runCleanup();
      
      const totalDeleted = results.reduce((sum, r) => sum + r.deletedCount, 0);
      
      return NextResponse.json({
        success: true,
        type: 'policy',
        results,
        totalDeleted,
        message: `Cleanup completed. Deleted ${totalDeleted} files across ${results.length} buckets`,
      });
    }
  } catch (error) {
    console.error('Storage cleanup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (!userRole || userRole.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }
    
    const cleanupService = getStorageCleanupService();
    const stats = await cleanupService.getStorageStats();
    
    return NextResponse.json({
      success: true,
      stats,
      policies: [
        {
          bucket: 'ticket-qr-codes',
          maxAgeInDays: 365,
          description: 'QR codes for tickets',
        },
        {
          bucket: 'confirmations',
          maxAgeInDays: 90,
          description: 'Confirmation and ticket PDFs',
        },
        {
          bucket: 'event-images',
          maxAgeInDays: 730,
          description: 'Event banner and thumbnail images',
        },
        {
          bucket: 'email-templates',
          maxAgeInDays: 30,
          description: 'Archived email templates',
        },
      ],
    });
  } catch (error) {
    console.error('Storage stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}