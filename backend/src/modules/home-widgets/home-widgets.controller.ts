import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UpdateTopProductsWidgetDto } from './dto/update-top-products-widget.dto';
import { HomeWidgetsService } from './home-widgets.service';

@ApiTags('Home Widgets')
@Controller('home-widgets')
export class HomeWidgetsController {
  constructor(private readonly homeWidgetsService: HomeWidgetsService) {}

  @Get('top-products')
  @ApiOperation({ summary: 'Get top products widget config' })
  getTopProductsWidget() {
    return this.homeWidgetsService.getTopProductsWidget();
  }

  @Put('top-products')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Update top products widget config' })
  updateTopProductsWidget(@Body() dto: UpdateTopProductsWidgetDto) {
    return this.homeWidgetsService.updateTopProductsWidget(dto);
  }
}