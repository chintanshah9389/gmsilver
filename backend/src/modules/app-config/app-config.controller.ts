import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
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
}
