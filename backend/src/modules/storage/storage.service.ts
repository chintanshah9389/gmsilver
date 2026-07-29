import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

export interface UploadResult {
  url: string;
  storageKey: string;
  bucket: string;
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_PDF_TYPE = ['application/pdf'];
const MAX_IMAGE_SIZE = 500 * 1024; // 500KB
const MAX_PDF_SIZE = 2 * 1024 * 1024; // 2MB

@Injectable()
export class StorageService {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;
  private readonly endpoint: string;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.get<string>('r2.accountId')?.trim();
    const endpoint = this.resolveEndpoint(
      this.configService.get<string>('r2.endpoint')?.trim(),
      accountId,
    );

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: this.configService.get<string>('r2.accessKeyId'),
        secretAccessKey: this.configService.get<string>('r2.secretAccessKey'),
      },
    });

    this.bucket = this.configService.get<string>('r2.bucket')?.trim();
    this.publicUrl = this.resolvePublicUrl(
      this.configService.get<string>('r2.publicUrl')?.trim(),
      endpoint,
      this.bucket,
    );
    this.endpoint = endpoint;
  }

  // ─── UPLOAD FILE ──────────────────────────────────────────────────
  async uploadFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    folder = 'uploads',
  ): Promise<UploadResult> {
    this.assertStorageConfigured();
    this.validateFile(buffer, mimeType);

    const ext = path.extname(originalName).toLowerCase();
    const storageKey = `${folder}/${uuidv4()}${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
      Body: buffer,
      ContentType: mimeType,
      CacheControl: 'public, max-age=31536000',
    });

    try {
      await this.s3Client.send(command);
    } catch (error: any) {
      throw new BadRequestException(this.getStorageErrorMessage(error));
    }

    return {
      url: `${this.publicUrl}/${storageKey}`,
      storageKey,
      bucket: this.bucket,
    };
  }

  // ─── UPLOAD IMAGE ──────────────────────────────────────────────────
  async uploadImage(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    folder = 'images',
  ): Promise<UploadResult> {
    if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      throw new BadRequestException(
        `Invalid image type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
      );
    }

    if (buffer.length > MAX_IMAGE_SIZE) {
      throw new BadRequestException('Image size must not exceed 500KB');
    }

    return this.uploadFile(buffer, originalName, mimeType, folder);
  }

  // ─── UPLOAD PDF ────────────────────────────────────────────────────
  async uploadPdf(
    buffer: Buffer,
    filename: string,
    folder = 'invoices',
  ): Promise<UploadResult> {
    if (buffer.length > MAX_PDF_SIZE) {
      throw new BadRequestException('PDF size must not exceed 2MB');
    }

    return this.uploadFile(buffer, filename, 'application/pdf', folder);
  }

  async replaceImage(
    oldStorageKey: string,
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    folder = 'images',
  ): Promise<UploadResult> {
    const result = await this.uploadImage(buffer, originalName, mimeType, folder);

    if (oldStorageKey) {
      this.deleteFile(oldStorageKey).catch((err) =>
        console.error('Failed to delete old file:', err),
      );
    }

    return result;
  }

  async replacePdf(
    oldStorageKey: string,
    buffer: Buffer,
    filename: string,
    folder = 'invoices',
  ): Promise<UploadResult> {
    const result = await this.uploadPdf(buffer, filename, folder);

    if (oldStorageKey) {
      this.deleteFile(oldStorageKey).catch((err) =>
        console.error('Failed to delete old file:', err),
      );
    }

    return result;
  }

  // ─── DELETE FILE ───────────────────────────────────────────────────
  async deleteFile(storageKey: string): Promise<void> {
    this.assertStorageConfigured();
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
    });

    try {
      await this.s3Client.send(command);
    } catch (error: any) {
      throw new BadRequestException(this.getStorageErrorMessage(error));
    }
  }

  // ─── REPLACE FILE ──────────────────────────────────────────────────
  async replaceFile(
    oldStorageKey: string,
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    folder = 'uploads',
  ): Promise<UploadResult> {
    // Upload new file first
    const result = await this.uploadFile(buffer, originalName, mimeType, folder);

    // Then delete old file (non-blocking)
    if (oldStorageKey) {
      this.deleteFile(oldStorageKey).catch((err) =>
        console.error('Failed to delete old file:', err),
      );
    }

    return result;
  }

  // ─── GET SIGNED URL ────────────────────────────────────────────────
  async getSignedUrl(storageKey: string, expiresIn = 3600): Promise<string> {
    this.assertStorageConfigured();
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  // ─── GET PUBLIC URL ────────────────────────────────────────────────
  getPublicUrl(storageKey: string): string {
    return `${this.publicUrl}/${storageKey}`;
  }

  // ─── FILE EXISTS ───────────────────────────────────────────────────
  async fileExists(storageKey: string): Promise<boolean> {
    this.assertStorageConfigured();
    try {
      await this.s3Client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: storageKey }),
      );
      return true;
    } catch {
      return false;
    }
  }

  // ─── PRIVATE HELPERS ──────────────────────────────────────────────
  private validateFile(buffer: Buffer, mimeType: string): void {
    const allAllowed = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_PDF_TYPE];

    if (!allAllowed.includes(mimeType)) {
      throw new BadRequestException(
        `Invalid file type: ${mimeType}. Allowed types: ${allAllowed.join(', ')}`,
      );
    }
  }

  private assertStorageConfigured(): void {
    const accessKeyId = this.configService.get<string>('r2.accessKeyId')?.trim();
    const secretAccessKey = this.configService.get<string>('r2.secretAccessKey')?.trim();
    const missing: string[] = [];

    if (!this.endpoint || this.isPlaceholderValue(this.endpoint)) {
      missing.push('R2_ACCOUNT_ID or R2_ENDPOINT');
    }

    if (!this.bucket || this.isPlaceholderValue(this.bucket)) {
      missing.push('R2_BUCKET');
    }

    if (!accessKeyId || this.isPlaceholderValue(accessKeyId)) {
      missing.push('R2_ACCESS_KEY_ID');
    }

    if (!secretAccessKey || this.isPlaceholderValue(secretAccessKey)) {
      missing.push('R2_SECRET_ACCESS_KEY');
    }

    if (missing.length > 0) {
      throw new BadRequestException(
        `Storage is not configured. Missing/invalid: ${missing.join(', ')}.`,
      );
    }

    if (!this.publicUrl) {
      throw new BadRequestException(
        'Storage is not configured. Set R2_PUBLIC_URL or ensure R2_ENDPOINT and R2_BUCKET are valid.',
      );
    }
  }

  private resolveEndpoint(explicitEndpoint?: string, accountId?: string): string {
    if (explicitEndpoint) {
      if (explicitEndpoint.startsWith('http://') || explicitEndpoint.startsWith('https://')) {
        return explicitEndpoint.replace(/\/+$/, '');
      }

      if (explicitEndpoint.includes('.')) {
        return `https://${explicitEndpoint.replace(/\/+$/, '')}`;
      }
    }

    if (!accountId) {
      return '';
    }

    if (accountId.startsWith('http://') || accountId.startsWith('https://')) {
      return accountId.replace(/\/+$/, '');
    }

    if (accountId.includes('.r2.cloudflarestorage.com')) {
      return `https://${accountId.replace(/\/+$/, '')}`;
    }

    return `https://${accountId}.r2.cloudflarestorage.com`;
  }

  private resolvePublicUrl(
    explicitPublicUrl?: string,
    endpoint?: string,
    bucket?: string,
  ): string {
    if (explicitPublicUrl) {
      if (explicitPublicUrl.startsWith('http://') || explicitPublicUrl.startsWith('https://')) {
        return explicitPublicUrl.replace(/\/+$/, '');
      }

      return `https://${explicitPublicUrl.replace(/\/+$/, '')}`;
    }

    if (!endpoint || !bucket) {
      return '';
    }

    return `${endpoint.replace(/\/+$/, '')}/${bucket}`;
  }

  private isPlaceholderValue(value: string): boolean {
    const normalized = value.toLowerCase();
    return (
      normalized.includes('your_') ||
      normalized.includes('your-') ||
      normalized.includes('xxxx')
    );
  }

  private getStorageErrorMessage(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    const normalized = message.toLowerCase();

    if (
      normalized.includes('ssl') ||
      normalized.includes('tls') ||
      normalized.includes('eproto') ||
      normalized.includes('handshake') ||
      normalized.includes('certificate')
    ) {
      return 'File upload failed due to storage SSL/endpoint configuration. Verify R2_ENDPOINT (or R2_ACCOUNT_ID), keys, bucket, and public URL in environment variables.';
    }

    return `File upload failed: ${message}`;
  }
}
