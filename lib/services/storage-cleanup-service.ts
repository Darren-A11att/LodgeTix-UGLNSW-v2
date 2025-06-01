import { getStorageService } from './storage-service';
import { createClient } from '@/utils/supabase/server';

export interface CleanupPolicy {
  bucket: string;
  path: string;
  maxAgeInDays: number;
  description: string;
}

/**
 * Service for cleaning up old storage files
 */
export class StorageCleanupService {
  private policies: CleanupPolicy[] = [
    {
      bucket: 'ticket-qr-codes',
      path: 'registrations',
      maxAgeInDays: 365, // Keep for 1 year
      description: 'QR codes for tickets',
    },
    {
      bucket: 'confirmations',
      path: 'registrations',
      maxAgeInDays: 90, // Keep for 90 days
      description: 'Confirmation and ticket PDFs',
    },
    {
      bucket: 'event-images',
      path: 'events',
      maxAgeInDays: 730, // Keep for 2 years
      description: 'Event banner and thumbnail images',
    },
    {
      bucket: 'email-templates',
      path: 'archives',
      maxAgeInDays: 30, // Keep archives for 30 days
      description: 'Archived email templates',
    },
  ];

  /**
   * Run cleanup for all buckets based on policies
   */
  async runCleanup(): Promise<{ bucket: string; deletedCount: number }[]> {
    const storageService = getStorageService();
    const results = [];
    
    for (const policy of this.policies) {
      try {
        console.log(`Running cleanup for ${policy.bucket}/${policy.path}...`);
        
        const deletedCount = await storageService.cleanupOldFiles(
          policy.bucket as any,
          policy.path,
          policy.maxAgeInDays
        );
        
        results.push({
          bucket: policy.bucket,
          deletedCount,
        });
        
        console.log(`Deleted ${deletedCount} files from ${policy.bucket}`);
      } catch (error) {
        console.error(`Cleanup failed for ${policy.bucket}:`, error);
        results.push({
          bucket: policy.bucket,
          deletedCount: 0,
        });
      }
    }
    
    return results;
  }

  /**
   * Clean up orphaned files (files not referenced in database)
   */
  async cleanupOrphanedFiles(): Promise<number> {
    const supabase = await createClient();
    const storageService = getStorageService();
    let totalDeleted = 0;
    
    try {
      // Get all ticket QR codes from storage
      const qrFiles = await storageService.list('ticket-qr-codes', 'registrations');
      
      // Get all ticket IDs from database
      const { data: tickets } = await supabase
        .from('tickets')
        .select('ticket_id, qr_code_url');
      
      const ticketIds = new Set(tickets?.map(t => t.id) || []);
      
      // Find orphaned QR codes
      const orphanedQRs = qrFiles.filter(file => {
        const ticketId = file.replace('.png', '').split('/').pop();
        return ticketId && !ticketIds.has(ticketId);
      });
      
      // Delete orphaned files in batches
      const batchSize = 10;
      for (let i = 0; i < orphanedQRs.length; i += batchSize) {
        const batch = orphanedQRs.slice(i, i + batchSize);
        const deleted = await storageService.delete('ticket-qr-codes', batch);
        if (deleted) {
          totalDeleted += batch.length;
        }
      }
      
      console.log(`Deleted ${totalDeleted} orphaned files`);
    } catch (error) {
      console.error('Orphaned file cleanup failed:', error);
    }
    
    return totalDeleted;
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    bucket: string;
    fileCount: number;
    totalSize: number;
  }[]> {
    const storageService = getStorageService();
    const stats = [];
    
    for (const policy of this.policies) {
      try {
        const files = await storageService.list(policy.bucket as any, policy.path);
        
        // Note: Supabase doesn't provide file sizes in list API
        // This would need to be implemented with additional metadata tracking
        stats.push({
          bucket: policy.bucket,
          fileCount: files.length,
          totalSize: 0, // Would need to track this separately
        });
      } catch (error) {
        console.error(`Failed to get stats for ${policy.bucket}:`, error);
        stats.push({
          bucket: policy.bucket,
          fileCount: 0,
          totalSize: 0,
        });
      }
    }
    
    return stats;
  }

  /**
   * Archive old files instead of deleting
   */
  async archiveOldFiles(bucket: string, path: string, maxAgeInDays: number): Promise<number> {
    const storageService = getStorageService();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeInDays);
    
    try {
      const files = await storageService.list(bucket as any, path);
      let archivedCount = 0;
      
      for (const file of files) {
        const filePath = `${path}/${file}`;
        const archivePath = `archive/${path}/${file}`;
        
        // Move to archive
        const moved = await storageService.move(bucket as any, filePath, archivePath);
        if (moved) {
          archivedCount++;
        }
      }
      
      return archivedCount;
    } catch (error) {
      console.error('Archive operation failed:', error);
      return 0;
    }
  }
}

// Singleton instance
let cleanupService: StorageCleanupService | null = null;

export function getStorageCleanupService(): StorageCleanupService {
  if (!cleanupService) {
    cleanupService = new StorageCleanupService();
  }
  return cleanupService;
}