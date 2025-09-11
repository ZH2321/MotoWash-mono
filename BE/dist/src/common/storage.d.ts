export declare class StorageHelper {
    private static client;
    static ensureBuckets(): Promise<void>;
    static uploadFile(bucket: string, path: string, file: Buffer, contentType: string): Promise<string>;
    static getSignedUrl(bucket: string, path: string, expiresIn?: number): Promise<string>;
    static deleteFile(bucket: string, path: string): Promise<void>;
    static getPublicUrl(bucket: string, path: string): string;
    static validateImageFile(file: any): {
        isValid: boolean;
        error?: string;
    };
    static generateFilePath(prefix: string, filename: string): string;
}
