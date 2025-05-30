import { createClient } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Storage Service for managing file uploads, downloads, and organization
 * Implements the storage strategy for QR codes, PDFs, and other assets
 */

export type BucketName = 'ticket-qr-codes' | 'confirmations' | 'event-images' | 'email-templates';

export interface StorageConfig {
  supabaseUrl: string;
  supabaseKey: string;
}

export interface FileUploadOptions {
  bucket: BucketName;
  path: string;
  file: Blob | Buffer | ArrayBuffer;
  contentType?: string;
  cacheControl?: string;
  upsert?: boolean;
}

export interface SignedUrlOptions {
  bucket: BucketName;
  path: string;
  expiresIn: number; // seconds
}

export class StorageService {
  private supabase: SupabaseClient;
  
  constructor(config: StorageConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
  }

  /**
   * Initialize storage buckets with appropriate policies
   */
  async initializeBuckets(): Promise<void> {
    const buckets: Array<{ name: BucketName; public: boolean }> = [
      { name: 'ticket-qr-codes', public: true },
      { name: 'confirmations', public: false },
      { name: 'event-images', public: true },
      { name: 'email-templates', public: false },
    ];

    for (const bucket of buckets) {
      try {
        const { data, error } = await this.supabase.storage.createBucket(bucket.name, {
          public: bucket.public,
          fileSizeLimit: bucket.name === 'event-images' ? 5242880 : 1048576, // 5MB for images, 1MB for others
          allowedMimeTypes: this.getAllowedMimeTypes(bucket.name),
        });

        if (error && error.message !== 'Bucket already exists') {
          console.error(`Failed to create bucket ${bucket.name}:`, error);
        }
      } catch (error) {
        console.error(`Error initializing bucket ${bucket.name}:`, error);
      }
    }
  }

  /**
   * Upload a file to storage
   */
  async upload(options: FileUploadOptions): Promise<{ path: string; url: string } | null> {
    try {
      const { data, error } = await this.supabase.storage
        .from(options.bucket)
        .upload(options.path, options.file, {
          contentType: options.contentType,
          cacheControl: options.cacheControl || '3600',
          upsert: options.upsert ?? true,
        });

      if (error) {
        console.error('Upload error:', error);
        return null;
      }

      // Get public URL if bucket is public
      const url = this.getPublicUrl(options.bucket, data.path);
      
      return {
        path: data.path,
        url,
      };
    } catch (error) {
      console.error('Storage upload failed:', error);
      return null;
    }
  }

  /**
   * Download a file from storage
   */
  async download(bucket: BucketName, path: string): Promise<Blob | null> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .download(path);

      if (error) {
        console.error('Download error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Storage download failed:', error);
      return null;
    }
  }

  /**
   * Delete a file from storage
   */
  async delete(bucket: BucketName, paths: string[]): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage
        .from(bucket)
        .remove(paths);

      if (error) {
        console.error('Delete error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Storage delete failed:', error);
      return false;
    }
  }

  /**
   * Get a signed URL for temporary access to private files
   */
  async getSignedUrl(options: SignedUrlOptions): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.storage
        .from(options.bucket)
        .createSignedUrl(options.path, options.expiresIn);

      if (error) {
        console.error('Signed URL error:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Failed to create signed URL:', error);
      return null;
    }
  }

  /**
   * Get public URL for files in public buckets
   */
  getPublicUrl(bucket: BucketName, path: string): string {
    const { data } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }

  /**
   * List files in a bucket directory
   */
  async list(bucket: BucketName, path: string): Promise<string[]> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .list(path);

      if (error) {
        console.error('List error:', error);
        return [];
      }

      return data.map(file => file.name);
    } catch (error) {
      console.error('Storage list failed:', error);
      return [];
    }
  }

  /**
   * Check if a file exists
   */
  async exists(bucket: BucketName, path: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .download(path);

      return !error && !!data;
    } catch {
      return false;
    }
  }

  /**
   * Move/rename a file
   */
  async move(bucket: BucketName, fromPath: string, toPath: string): Promise<boolean> {
    try {
      const { data: moveData, error: moveError } = await this.supabase.storage
        .from(bucket)
        .move(fromPath, toPath);

      if (moveError) {
        console.error('Move error:', moveError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Storage move failed:', error);
      return false;
    }
  }

  /**
   * Copy a file
   */
  async copy(bucket: BucketName, fromPath: string, toPath: string): Promise<boolean> {
    try {
      const { data: copyData, error: copyError } = await this.supabase.storage
        .from(bucket)
        .copy(fromPath, toPath);

      if (copyError) {
        console.error('Copy error:', copyError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Storage copy failed:', error);
      return false;
    }
  }

  /**
   * Clean up old files based on age
   */
  async cleanupOldFiles(bucket: BucketName, path: string, maxAgeInDays: number): Promise<number> {
    try {
      const files = await this.list(bucket, path);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAgeInDays);
      
      let deletedCount = 0;
      
      for (const file of files) {
        const { data: metadata } = await this.supabase.storage
          .from(bucket)
          .list(path, {
            limit: 1,
            offset: 0,
            search: file,
          });
        
        if (metadata && metadata[0]) {
          const fileDate = new Date(metadata[0].created_at);
          if (fileDate < cutoffDate) {
            const deleted = await this.delete(bucket, [`${path}/${file}`]);
            if (deleted) deletedCount++;
          }
        }
      }
      
      return deletedCount;
    } catch (error) {
      console.error('Cleanup failed:', error);
      return 0;
    }
  }

  /**
   * Get allowed MIME types for each bucket
   */
  private getAllowedMimeTypes(bucket: BucketName): string[] | undefined {
    switch (bucket) {
      case 'ticket-qr-codes':
        return ['image/png'];
      case 'confirmations':
        return ['application/pdf'];
      case 'event-images':
        return ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      case 'email-templates':
        return ['text/html', 'text/plain'];
      default:
        return undefined;
    }
  }
}

// Singleton instance
let storageService: StorageService | null = null;

export function getStorageService(): StorageService {
  if (!storageService) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration is missing');
    }
    
    storageService = new StorageService({
      supabaseUrl,
      supabaseKey,
    });
  }
  
  return storageService;
}