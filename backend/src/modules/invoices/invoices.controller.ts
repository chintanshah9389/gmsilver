import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { BulkDeleteInvoicesDto } from './dto/bulk-delete-invoices.dto';

@ApiTags('Invoices')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @ApiOperation({ summary: 'Get my invoices' })
  getMyInvoices(@CurrentUser('id') userId: string) {
    return this.invoicesService.getUserInvoices(userId);
  }

  @Get('all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get all invoices (Admin/Owner)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getAllInvoices(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.invoicesService.findAllAdmin({ page, limit });
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get invoice by order ID' })
  getInvoiceByOrder(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
  ) {
    return this.invoicesService.getInvoiceByOrderId(orderId, user.id, user.role);
  }

  @Post('generate/:orderId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Generate invoice for an order (Admin/Owner)' })
  generateInvoice(@Param('orderId') orderId: string) {
    return this.invoicesService.generateInvoice(orderId);
  }

  @Delete('bulk')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Bulk delete invoices (Admin/Owner)' })
  removeMany(@Body() dto: BulkDeleteInvoicesDto) {
    return this.invoicesService.removeMany(dto.ids);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Delete an invoice (Admin/Owner)' })
  remove(@Param('id') id: string) {
    return this.invoicesService.remove(id);
  }
}
