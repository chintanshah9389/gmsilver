import {
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ExcelService } from './excel.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Excel')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.OWNER)
@Controller('excel')
export class ExcelController {
  constructor(private readonly excelService: ExcelService) {}

  @Get('export/products')
  @ApiOperation({ summary: 'Export all products to Excel' })
  async exportProducts(@Res() res: Response) {
    const buffer = await this.excelService.exportProducts();
    this.sendExcelResponse(res, buffer, 'products');
  }

  @Post('import/products')
  @ApiOperation({ summary: 'Import products from Excel' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async importProducts(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const result = await this.excelService.importProducts(file.buffer);
    return {
      message: `Imported ${result.imported} products`,
      data: result,
    };
  }

  @Get('export/users')
  @ApiOperation({ summary: 'Export all users to Excel' })
  async exportUsers(@Res() res: Response) {
    const buffer = await this.excelService.exportUsers();
    this.sendExcelResponse(res, buffer, 'users');
  }

  @Get('export/orders')
  @ApiOperation({ summary: 'Export orders to Excel' })
  async exportOrders(@Query() query: any, @Res() res: Response) {
    const buffer = await this.excelService.exportOrders(query);
    this.sendExcelResponse(res, buffer, 'orders');
  }

  private sendExcelResponse(res: Response, buffer: Buffer, filename: string) {
    const date = new Date().toISOString().split('T')[0];
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}-${date}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }
}
