import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseService } from '../db/supabase';

export class StorageHelper {
  private static client: SupabaseClient = supabaseService;

  static async ensureBuckets(): Promise<void> {
    const buckets = ['slips', 'job-photos'];
    
    for (const bucketName of buckets) {
      const { data, error } = await this.client.storage.getBucket(bucketName);
      
      if (error && error.message.includes('not found')) {
        // Create bucket if it doesn't exist
        const { error: createError } = await this.client.storage.createBucket(bucketName, {
          public: false,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
          fileSizeLimit: 5 * 1024 * 1024, // 5MB
        });
        
        if (createError) {
          console.error(`Failed to create bucket ${bucketName}:`, createError);
          throw new Error(`Failed to create storage bucket: ${bucketName}`);
        }
        
        console.log(`✅ Created storage bucket: ${bucketName}`);
      } else if (error) {
        console.error(`Failed to check bucket ${bucketName}:`, error);
        throw new Error(`Failed to check storage bucket: ${bucketName}`);
      }
    }
  }

  static async uploadFile(
    bucket: string,
    path: string,
    file: Buffer,
    contentType: string,
  ): Promise<string> {
    const { data, error } = await this.client.storage
      .from(bucket)
      .upload(path, file, {
        contentType,
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    return data.path;
  }

  static async getSignedUrl(bucket: string, path: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await this.client.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Storage signed URL error:', error);
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  static async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await this.client.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Storage delete error:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  static getPublicUrl(bucket: string, path: string): string {
    const { data } = this.client.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  static validateImageFile(file: any): { isValid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.mimetype)) {
      return {
        isValid: false,
        error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size too large. Maximum size: 5MB',
      };
    }

    return { isValid: true };
  }

  static generateFilePath(prefix: string, filename: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = filename.split('.').pop();
    return `${prefix}/${timestamp}-${random}.${extension}`;
  }
}