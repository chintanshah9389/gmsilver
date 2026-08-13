import { Controller, Get, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { BulkDeleteAuditLogsDto } from './dto/bulk-delete-audit-logs.dto';

@ApiTags('Audit Logs')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all audit logs (Admin only)' })
  findAll(@Query() query: any) {
    return this.auditLogsService.findAll(query);
  }

  @Get('my-journey')
  @ApiOperation({ summary: 'Get my activity journey' })
  getMyJourney(
    @CurrentUser('id') userId: string,
    @Query('limit') limit: number,
  ) {
    return this.auditLogsService.getUserJourney(userId, +limit || 50);
  }

  @Get('summary')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get activity summary (Admin only)' })
  getSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.auditLogsService.getActivitySummary(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Delete('bulk')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Bulk delete audit logs (Admin/Owner)' })
  removeMany(@Body() dto: BulkDeleteAuditLogsDto) {
    return this.auditLogsService.removeMany(dto.ids);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Delete an audit log (Admin/Owner)' })
  remove(@Param('id') id: string) {
    return this.auditLogsService.remove(id);
  }
}
