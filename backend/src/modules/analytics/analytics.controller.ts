import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Analytics')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.OWNER)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  getDashboard() {
    return this.analyticsService.getDashboardStats();
  }

  @Get('products/most-viewed')
  @ApiOperation({ summary: 'Get most viewed products' })
  getMostViewed(@Query('limit') limit = 10) {
    return this.analyticsService.getMostViewedProducts(+limit);
  }

  @Get('products/most-ordered')
  @ApiOperation({ summary: 'Get most ordered products' })
  getMostOrdered(@Query('limit') limit = 10) {
    return this.analyticsService.getMostOrderedProducts(+limit);
  }

  @Get('search/keywords')
  @ApiOperation({ summary: 'Get most searched keywords' })
  getSearchKeywords(@Query('limit') limit = 10) {
    return this.analyticsService.getMostSearchedKeywords(+limit);
  }

  @Get('revenue/chart')
  @ApiOperation({ summary: 'Get revenue chart data' })
  getRevenueChart(@Query('months') months = 6) {
    return this.analyticsService.getRevenueChart(+months);
  }

  @Get('users/active')
  @ApiOperation({ summary: 'Get active users in last N hours' })
  getActiveUsers(@Query('hours') hours = 24) {
    return this.analyticsService.getActiveUsers(+hours);
  }
}
