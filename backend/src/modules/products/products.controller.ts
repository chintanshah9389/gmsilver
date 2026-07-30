import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFiltersDto } from './dto/product-filters.dto';
import { BulkDeleteProductsDto } from './dto/bulk-delete-products.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  private normalizeProductFiles(files?: {
    images?: Express.Multer.File[];
    pdf?: Express.Multer.File[];
  }) {
    return {
      images: files?.images ?? [],
      pdf: files?.pdf?.[0],
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all products with filters' })
  findAll(@Query() filters: ProductFiltersDto) {
    return this.productsService.findAll(filters);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search products' })
  @ApiQuery({ name: 'q', required: true })
  search(
    @Query('q') query: string,
    @Query() filters: ProductFiltersDto,
  ) {
    return this.productsService.search(query, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  findOne(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Post()
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Create a new product (Admin/Owner)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'images', maxCount: 3 },
      { name: 'pdf', maxCount: 1 },
    ]),
  )
  create(
    @Body() dto: CreateProductDto,
    @UploadedFiles()
    files?: { images?: Express.Multer.File[]; pdf?: Express.Multer.File[] },
  ) {
    const { images, pdf } = this.normalizeProductFiles(files);
    return this.productsService.create(dto, images, pdf);
  }

  @Put(':id')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Update a product (Admin/Owner)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'images', maxCount: 3 },
      { name: 'pdf', maxCount: 1 },
    ]),
  )
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @UploadedFiles()
    files?: { images?: Express.Multer.File[]; pdf?: Express.Multer.File[] },
  ) {
    const { images, pdf } = this.normalizeProductFiles(files);
    return this.productsService.update(id, dto, images, pdf);
  }

  @Post(':id/images')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Add images to a product' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 3))
  addImages(
    @Param('id') id: string,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    return this.productsService.addImages(id, images);
  }

  @Delete(':id/images/:imageId')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Delete a product image' })
  removeImage(
    @Param('id') productId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.productsService.removeImage(productId, imageId);
  }

  @Delete('bulk')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Bulk delete products (Admin only)' })
  removeMany(@Body() dto: BulkDeleteProductsDto) {
    return this.productsService.removeMany(dto.ids);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a product (Admin only)' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
