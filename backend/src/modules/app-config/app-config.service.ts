import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { UpdateAppReleaseConfigDto } from './dto/update-app-release-config.dto';

const DEFAULT_ID = 'default';

@Injectable()
export class AppConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  private defaults() {
    return {
      id: DEFAULT_ID,
      androidLatestVersionName: '1.0.1',
      androidLatestVersionCode: 2,
      androidMinVersionCode: 1,
      androidApkUrl: null as string | null,
      androidApkStorageKey: null as string | null,
      androidDistributionMode: 'DIRECT_APK',
      androidPlayStoreUrl: null as string | null,
      androidForceUpdate: false,
      iosLatestVersionName: '1.0.1',
      iosStoreUrl: null as string | null,
      iosForceUpdate: false,
      message:
        'A new version of GM Silver is available. Please download and install the latest APK.',
      enabled: true,
    };
  }

  async ensureRow() {
    const existing = await this.prisma.appReleaseConfig.findUnique({
      where: { id: DEFAULT_ID },
    });
    if (existing) {
      return existing;
    }
    return this.prisma.appReleaseConfig.create({
      data: this.defaults(),
    });
  }

  private resolveAndroidDownloadUrl(row: {
    androidDistributionMode: string;
    androidApkUrl: string | null;
    androidPlayStoreUrl: string | null;
  }) {
    if (row.androidDistributionMode === 'PLAY_STORE') {
      return row.androidPlayStoreUrl;
    }
    return row.androidApkUrl;
  }

  async getPublicConfig() {
    const row = await this.ensureRow();
    const downloadUrl = this.resolveAndroidDownloadUrl(row);
    return {
      data: {
        enabled: row.enabled,
        message: row.message,
        android: {
          latestVersionName: row.androidLatestVersionName,
          latestVersionCode: row.androidLatestVersionCode,
          minVersionCode: row.androidMinVersionCode,
          distributionMode: row.androidDistributionMode,
          apkUrl: row.androidApkUrl,
          playStoreUrl: row.androidPlayStoreUrl,
          downloadUrl,
          forceUpdate: row.androidForceUpdate,
        },
        ios: {
          latestVersionName: row.iosLatestVersionName,
          storeUrl: row.iosStoreUrl,
          forceUpdate: row.iosForceUpdate,
        },
      },
    };
  }

  async getAdminConfig() {
    const row = await this.ensureRow();
    return { data: row };
  }

  async updateConfig(dto: UpdateAppReleaseConfigDto) {
    await this.ensureRow();

    const data: Record<string, unknown> = {};
    if (dto.androidLatestVersionName !== undefined) {
      data.androidLatestVersionName = dto.androidLatestVersionName.trim();
    }
    if (dto.androidLatestVersionCode !== undefined) {
      data.androidLatestVersionCode = dto.androidLatestVersionCode;
    }
    if (dto.androidMinVersionCode !== undefined) {
      data.androidMinVersionCode = dto.androidMinVersionCode;
    }
    if (dto.androidApkUrl !== undefined) {
      data.androidApkUrl = dto.androidApkUrl?.trim() || null;
    }
    if (dto.androidDistributionMode !== undefined) {
      data.androidDistributionMode = dto.androidDistributionMode;
    }
    if (dto.androidPlayStoreUrl !== undefined) {
      data.androidPlayStoreUrl = dto.androidPlayStoreUrl?.trim() || null;
    }
    if (dto.androidForceUpdate !== undefined) {
      data.androidForceUpdate = dto.androidForceUpdate;
    }
    if (dto.iosLatestVersionName !== undefined) {
      data.iosLatestVersionName = dto.iosLatestVersionName.trim();
    }
    if (dto.iosStoreUrl !== undefined) {
      data.iosStoreUrl = dto.iosStoreUrl?.trim() || null;
    }
    if (dto.iosForceUpdate !== undefined) {
      data.iosForceUpdate = dto.iosForceUpdate;
    }
    if (dto.message !== undefined) {
      data.message = dto.message.trim();
    }
    if (dto.enabled !== undefined) {
      data.enabled = dto.enabled;
    }

    const updated = await this.prisma.appReleaseConfig.update({
      where: { id: DEFAULT_ID },
      data,
    });

    return {
      message: 'App release config updated successfully',
      data: updated,
    };
  }

  /**
   * Upload APK to R2 (always replaces releases/gmsilver-latest.apk)
   * and point androidApkUrl at it for DIRECT_APK updates.
   */
  async uploadAndroidApk(
    file: Express.Multer.File,
    opts?: {
      versionName?: string;
      versionCode?: number;
      minVersionCode?: number;
      forceUpdate?: boolean;
      message?: string;
    },
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('No APK file uploaded');
    }

    const name = (file.originalname || '').toLowerCase();
    const mime = (file.mimetype || '').toLowerCase();
    const looksLikeApk =
      name.endsWith('.apk') ||
      mime.includes('android.package') ||
      mime === 'application/octet-stream' ||
      mime === 'application/zip';

    if (!looksLikeApk) {
      throw new BadRequestException('File must be an Android APK (.apk)');
    }

    const row = await this.ensureRow();
    const uploaded = await this.storageService.uploadLatestApk(
      file.buffer,
      file.mimetype,
    );

    const versionCode =
      opts?.versionCode && opts.versionCode > 0
        ? opts.versionCode
        : row.androidLatestVersionCode;
    // Cache-bust so devices always fetch the replaced file
    const publicUrl = `${uploaded.url}?v=${versionCode}`;

    const updated = await this.prisma.appReleaseConfig.update({
      where: { id: DEFAULT_ID },
      data: {
        androidApkUrl: publicUrl,
        androidApkStorageKey: uploaded.storageKey,
        androidDistributionMode: 'DIRECT_APK',
        ...(opts?.versionName?.trim()
          ? { androidLatestVersionName: opts.versionName.trim() }
          : {}),
        ...(opts?.versionCode && opts.versionCode > 0
          ? { androidLatestVersionCode: opts.versionCode }
          : {}),
        ...(opts?.minVersionCode && opts.minVersionCode > 0
          ? { androidMinVersionCode: opts.minVersionCode }
          : {}),
        ...(opts?.forceUpdate !== undefined
          ? { androidForceUpdate: opts.forceUpdate }
          : {}),
        ...(opts?.message?.trim() ? { message: opts.message.trim() } : {}),
      },
    });

    return {
      message:
        'APK uploaded and set as latest download. Older file was replaced.',
      data: updated,
    };
  }
}
