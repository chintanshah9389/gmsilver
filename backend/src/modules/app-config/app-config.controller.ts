import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { memoryStorage } from 'multer';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AppConfigService } from './app-config.service';
import { UpdateAppReleaseConfigDto } from './dto/update-app-release-config.dto';

@ApiTags('App Config')
@Controller('app-config')
export class AppConfigController {
  constructor(private readonly appConfigService: AppConfigService) {}

  @Get()
  @ApiOperation({
    summary: 'Public mobile app update config (no auth)',
  })
  getPublicConfig() {
    return this.appConfigService.getPublicConfig();
  }

  @Get('admin')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get app release config for admin' })
  getAdminConfig() {
    return this.appConfigService.getAdminConfig();
  }

  @Put()
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Update app release / force-update config' })
  updateConfig(@Body() dto: UpdateAppReleaseConfigDto) {
    return this.appConfigService.updateConfig(dto);
  }

  @Post('android-apk')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({
    summary:
      'Upload latest Android APK (replaces previous file) and set download URL',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
        versionName: { type: 'string', example: '1.0.1' },
        versionCode: { type: 'string', example: '2' },
        minVersionCode: { type: 'string', example: '1' },
        forceUpdate: { type: 'string', example: 'false' },
        message: { type: 'string' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 200 * 1024 * 1024 },
    }),
  )
  uploadAndroidApk(
    @UploadedFile() file: Express.Multer.File,
    @Body('versionName') versionName?: string,
    @Body('versionCode') versionCodeRaw?: string,
    @Body('minVersionCode') minVersionCodeRaw?: string,
    @Body('forceUpdate') forceUpdateRaw?: string,
    @Body('message') message?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No APK file uploaded');
    }

    const versionCode = versionCodeRaw ? parseInt(versionCodeRaw, 10) : undefined;
    const minVersionCode = minVersionCodeRaw
      ? parseInt(minVersionCodeRaw, 10)
      : undefined;
    const forceUpdate =
      forceUpdateRaw === 'true'
        ? true
        : forceUpdateRaw === 'false'
          ? false
          : undefined;

    return this.appConfigService.uploadAndroidApk(file, {
      versionName,
      versionCode: Number.isFinite(versionCode) ? versionCode : undefined,
      minVersionCode: Number.isFinite(minVersionCode)
        ? minVersionCode
        : undefined,
      forceUpdate,
      message,
    });
  }
}
