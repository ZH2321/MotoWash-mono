"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageHelper = void 0;
const supabase_1 = require("../db/supabase");
class StorageHelper {
    static async ensureBuckets() {
        const buckets = ['slips', 'job-photos'];
        for (const bucketName of buckets) {
            const { data, error } = await this.client.storage.getBucket(bucketName);
            if (error && error.message.includes('not found')) {
                const { error: createError } = await this.client.storage.createBucket(bucketName, {
                    public: false,
                    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
                    fileSizeLimit: 5 * 1024 * 1024,
                });
                if (createError) {
                    console.error(`Failed to create bucket ${bucketName}:`, createError);
                    throw new Error(`Failed to create storage bucket: ${bucketName}`);
                }
                console.log(`✅ Created storage bucket: ${bucketName}`);
            }
            else if (error) {
                console.error(`Failed to check bucket ${bucketName}:`, error);
                throw new Error(`Failed to check storage bucket: ${bucketName}`);
            }
        }
    }
    static async uploadFile(bucket, path, file, contentType) {
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
    static async getSignedUrl(bucket, path, expiresIn = 3600) {
        const { data, error } = await this.client.storage
            .from(bucket)
            .createSignedUrl(path, expiresIn);
        if (error) {
            console.error('Storage signed URL error:', error);
            throw new Error(`Failed to create signed URL: ${error.message}`);
        }
        return data.signedUrl;
    }
    static async deleteFile(bucket, path) {
        const { error } = await this.client.storage
            .from(bucket)
            .remove([path]);
        if (error) {
            console.error('Storage delete error:', error);
            throw new Error(`Failed to delete file: ${error.message}`);
        }
    }
    static getPublicUrl(bucket, path) {
        const { data } = this.client.storage
            .from(bucket)
            .getPublicUrl(path);
        return data.publicUrl;
    }
    static validateImageFile(file) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        const maxSize = 5 * 1024 * 1024;
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
    static generateFilePath(prefix, filename) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        const extension = filename.split('.').pop();
        return `${prefix}/${timestamp}-${random}.${extension}`;
    }
}
exports.StorageHelper = StorageHelper;
StorageHelper.client = supabase_1.supabaseService;
//# sourceMappingURL=storage.js.map