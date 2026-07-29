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

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.get<string>('r2.accountId');

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.configService.get<string>('r2.accessKeyId'),
        secretAccessKey: this.configService.get<string>('r2.secretAccessKey'),
      },
    });

    this.bucket = this.configService.get<string>('r2.bucket');
    this.publicUrl = this.configService.get<string>('r2.publicUrl');
  }

  // ─── UPLOAD FILE ──────────────────────────────────────────────────
  async uploadFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    folder = 'uploads',
  ): Promise<UploadResult> {
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

    await this.s3Client.send(command);

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
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
    });

    await this.s3Client.send(command);
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
}
