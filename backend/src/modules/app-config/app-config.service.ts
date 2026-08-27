import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateAppReleaseConfigDto } from './dto/update-app-release-config.dto';

const DEFAULT_ID = 'default';

@Injectable()
export class AppConfigService {
  constructor(private readonly prisma: PrismaService) {}

  private defaults() {
    return {
      id: DEFAULT_ID,
      androidLatestVersionName: '1.0.0',
      androidLatestVersionCode: 1,
      androidMinVersionCode: 1,
      androidApkUrl: null as string | null,
      androidForceUpdate: false,
      iosLatestVersionName: '1.0.0',
      iosStoreUrl: null as string | null,
      iosForceUpdate: false,
      message:
        'A new version of GM Silver is available. Please update to continue.',
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

  async getPublicConfig() {
    const row = await this.ensureRow();
    return {
      data: {
        enabled: row.enabled,
        message: row.message,
        android: {
          latestVersionName: row.androidLatestVersionName,
          latestVersionCode: row.androidLatestVersionCode,
          minVersionCode: row.androidMinVersionCode,
          apkUrl: row.androidApkUrl,
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
      const url = dto.androidApkUrl?.trim() || null;
      data.androidApkUrl = url;
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
}
