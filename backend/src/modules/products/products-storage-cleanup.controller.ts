import { Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { StorageDeleteCleanupService } from './storage-delete-cleanup.service';

@ApiTags('Products Cleanup')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('products/storage-cleanup')
export class ProductsStorageCleanupController {
  constructor(private readonly cleanupService: StorageDeleteCleanupService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get storage cleanup queue stats (Admin only)' })
  @ApiQuery({ name: 'productId', required: false, type: String })
  async getStats(@Query('productId') productId?: string) {
    const data = await this.cleanupService.getStats(productId);
    return { data };
  }

  @Get('failures')
  @ApiOperation({ summary: 'List failed storage delete records (Admin only)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'mode', required: false, enum: ['pending', 'permanent', 'all'] })
  @ApiQuery({ name: 'productId', required: false, type: String })
  async listFailures(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('mode') mode?: 'pending' | 'permanent' | 'all',
    @Query('productId') productId?: string,
  ) {
    const data = await this.cleanupService.listFailures(limit, mode ?? 'pending', productId);
    return { data, count: data.length };
  }

  @Post('retry/:id')
  @ApiOperation({ summary: 'Force retry a failed storage delete record (Admin only)' })
  async retryOne(@Param('id') id: string) {
    const updated = await this.cleanupService.retryNow(id);

    if (!updated) {
      return { message: 'Cleanup record not found' };
    }

    await this.cleanupService.runCleanupNow();

    return { message: 'Cleanup retry triggered', data: updated };
  }

  @Post('run')
  @ApiOperation({ summary: 'Run storage cleanup worker now (Admin only)' })
  async runNow() {
    await this.cleanupService.runCleanupNow();
    return { message: 'Storage cleanup run triggered' };
  }
}
