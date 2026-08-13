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
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get all audit logs with user, date, and time filters' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user id' })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'module', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'startDate', required: false, description: 'YYYY-MM-DD or ISO datetime' })
  @ApiQuery({ name: 'endDate', required: false, description: 'YYYY-MM-DD or ISO datetime' })
  @ApiQuery({ name: 'startTime', required: false, description: 'HH:mm, used with startDate' })
  @ApiQuery({ name: 'endTime', required: false, description: 'HH:mm, used with endDate' })
  findAll(@Query() query: any) {
    return this.auditLogsService.findAll(query);
  }

  @Get('users')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Users list for audit log filters' })
  getFilterUsers() {
    return this.auditLogsService.getFilterUsers();
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
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get activity summary (Admin/Owner)' })
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
