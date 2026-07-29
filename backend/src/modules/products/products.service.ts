import 'multer';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFiltersDto } from './dto/product-filters.dto';
import {
  getPaginationParams,
  createPaginatedResponse,
} from '../../common/utils/pagination.util';

@Injectable()
export class ProductsService {
  private static readonly MAX_PRODUCT_IMAGES = 3;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(filters: ProductFiltersDto) {
    const { page, limit, skip } = getPaginationParams(filters);

    const where: any = {
      deletedAt: null,
      isActive: true,
    };

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.isAvailable !== undefined) {
      where.isAvailable = filters.isAvailable === 'true';
    }

    if (filters.minPrice || filters.maxPrice) {
      where.price = {};
      if (filters.minPrice) where.price.gte = parseFloat(filters.minPrice);
      if (filters.maxPrice) where.price.lte = parseFloat(filters.maxPrice);
    }

    const orderBy: any = {};
    if (filters.sortBy === 'price_asc') orderBy.price = 'asc';
    else if (filters.sortBy === 'price_desc') orderBy.price = 'desc';
    else if (filters.sortBy === 'name') orderBy.name = 'asc';
    else orderBy.createdAt = 'desc';

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: { select: { id: true, name: true } },
          images: {
            orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const normalizedProducts = products.map((product) => this.withResolvedAssetUrls(product));

    return createPaginatedResponse(normalizedProducts, total, page, limit);
  }

  async search(query: string, filters: ProductFiltersDto) {
    const { page, limit, skip } = getPaginationParams(filters);

    const where: any = {
      deletedAt: null,
      isActive: true,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } },
        { purity: { contains: query, mode: 'insensitive' } },
      ],
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true } },
          images: { orderBy: [{ isPrimary: 'desc' }], take: 1 },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const normalizedProducts = products.map((product) => this.withResolvedAssetUrls(product));

    return createPaginatedResponse(normalizedProducts, total, page, limit);
  }

  async findById(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: { select: { id: true, name: true, imageUrl: true } },
        images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return { data: this.withResolvedAssetUrls(product) };
  }

  async create(
    dto: CreateProductDto,
    images: Express.Multer.File[] = [],
    pdf?: Express.Multer.File,
  ) {
    this.ensureValidImageCount(images.length);
    const normalizedSku = this.normalizeSku(dto.sku);
    await this.assertSkuUnique(normalizedSku);
    const parsedQuantity = dto.quantity !== undefined ? Number.parseInt(dto.quantity, 10) : 0;

    if (Number.isNaN(parsedQuantity) || parsedQuantity < 0) {
      throw new BadRequestException('Quantity must be a non-negative number');
    }

    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        price: parseFloat(dto.price),
        weight: dto.weight ? parseFloat(dto.weight) : undefined,
        purity: dto.purity,
        sku: normalizedSku,
        categoryId: dto.categoryId,
        isAvailable: dto.isAvailable !== 'false',
        isActive: dto.isActive !== 'false',
        quantity: parsedQuantity,
      },
    });

    const imageFolder = this.buildProductImageFolder(product.sku, product.id);
    const pdfFolder = this.buildProductPdfFolder(product.sku, product.id);

    let imageUrl: string | undefined;
    let storageKey: string | undefined;
    let pdfUrl: string | undefined;
    let pdfStorageKey: string | undefined;

    // Upload primary image (first image)
    if (images && images.length > 0) {
      const primaryUpload = await this.storageService.uploadImage(
        images[0].buffer,
        images[0].originalname,
        images[0].mimetype,
        imageFolder,
      );
      imageUrl = primaryUpload.url;
      storageKey = primaryUpload.storageKey;

      await this.prisma.product.update({
        where: { id: product.id },
        data: {
          imageUrl,
          storageKey,
        },
      });
    }

    // Upload additional images
    if (images && images.length > 1) {
      const imageUploads = await Promise.all(
        images.slice(1).map((img, index) =>
          this.storageService
            .uploadImage(
              img.buffer,
              img.originalname,
              img.mimetype,
              imageFolder,
            )
            .then((uploaded) => ({
              productId: product.id,
              imageUrl: uploaded.url,
              storageKey: uploaded.storageKey,
              isPrimary: false,
              sortOrder: index + 1,
            })),
        ),
      );

      await this.prisma.productImage.createMany({ data: imageUploads });
    }

    if (pdf) {
      const pdfUpload = await this.storageService.uploadPdf(
        pdf.buffer,
        pdf.originalname,
        pdfFolder,
      );
      pdfUrl = pdfUpload.url;
      pdfStorageKey = pdfUpload.storageKey;

      await this.prisma.product.update({
        where: { id: product.id },
        data: {
          pdfUrl,
          pdfStorageKey,
        },
      });
    }

    // Also create primary image entry
    if (imageUrl && storageKey) {
      await this.prisma.productImage.create({
        data: {
          productId: product.id,
          imageUrl,
          storageKey,
          isPrimary: true,
          sortOrder: 0,
        },
      });
    }

    // Notify users about new product
    await this.notificationsService.broadcastNewProduct(product.id, product.name);

    const result = await this.findById(product.id);
    return { message: 'Product created successfully', data: result.data };
  }

  async update(
    id: string,
    dto: UpdateProductDto,
    images: Express.Multer.File[] = [],
    pdf?: Express.Multer.File,
  ) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    let imageUrl = product.imageUrl;
    let storageKey = product.storageKey;
    let pdfUrl = product.pdfUrl;
    let pdfStorageKey = product.pdfStorageKey;
    const effectiveSku = dto.sku || product.sku;
    const imageFolder = this.buildProductImageFolder(effectiveSku, product.id);
    const pdfFolder = this.buildProductPdfFolder(effectiveSku, product.id);

    if (images.length > 1) {
      throw new BadRequestException('Only one primary image can be updated at a time');
    }

    if (images[0]) {
      const uploaded = await this.storageService.replaceImage(
        product.storageKey,
        images[0].buffer,
        images[0].originalname,
        images[0].mimetype,
        imageFolder,
      );
      imageUrl = uploaded.url;
      storageKey = uploaded.storageKey;

      const primaryImage = await this.prisma.productImage.findFirst({
        where: { productId: id, isPrimary: true },
      });

      if (primaryImage) {
        await this.prisma.productImage.update({
          where: { id: primaryImage.id },
          data: { imageUrl, storageKey },
        });
      }
    }

    if (pdf) {
      const uploadedPdf = pdfStorageKey
        ? await this.storageService.replacePdf(
            pdfStorageKey,
            pdf.buffer,
            pdf.originalname,
            pdfFolder,
          )
        : await this.storageService.uploadPdf(
            pdf.buffer,
            pdf.originalname,
            pdfFolder,
          );

      pdfUrl = uploadedPdf.url;
      pdfStorageKey = uploadedPdf.storageKey;
    }

    const updateData: any = {
      imageUrl,
      storageKey,
      pdfUrl,
      pdfStorageKey,
    };

    if (dto.name) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.price) updateData.price = parseFloat(dto.price);
    if (dto.weight) updateData.weight = parseFloat(dto.weight);
    if (dto.purity) updateData.purity = dto.purity;
    if (dto.sku !== undefined) {
      const normalizedSku = this.normalizeSku(dto.sku);
      await this.assertSkuUnique(normalizedSku, id);
      updateData.sku = normalizedSku;
    }
    if (dto.categoryId) updateData.categoryId = dto.categoryId;
    if (dto.isAvailable !== undefined) updateData.isAvailable = dto.isAvailable !== 'false';
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive !== 'false';
    if (dto.quantity !== undefined) {
      const parsedQuantity = Number.parseInt(dto.quantity, 10);

      if (Number.isNaN(parsedQuantity) || parsedQuantity < 0) {
        throw new BadRequestException('Quantity must be a non-negative number');
      }

      updateData.quantity = parsedQuantity;
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: { select: { id: true, name: true } },
        images: { orderBy: [{ isPrimary: 'desc' }] },
      },
    });

    return {
      message: 'Product updated successfully',
      data: this.withResolvedAssetUrls(updated),
    };
  }

  async addImages(productId: string, images: Express.Multer.File[]) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existingImageCount = await this.prisma.productImage.count({
      where: { productId },
    });

    this.ensureValidImageCount(existingImageCount + images.length, existingImageCount);

    const imageData = await Promise.all(
      images.map((img, index) =>
        this.storageService
          .uploadImage(
            img.buffer,
            img.originalname,
            img.mimetype,
            this.buildProductImageFolder(product.sku, product.id),
          )
          .then((uploaded) => ({
            productId,
            imageUrl: uploaded.url,
            storageKey: uploaded.storageKey,
            isPrimary: false,
            sortOrder: index,
          })),
      ),
    );

    await this.prisma.productImage.createMany({ data: imageData });

    return { message: 'Images added successfully' };
  }

  async removeImage(productId: string, imageId: string) {
    const image = await this.prisma.productImage.findFirst({
      where: { id: imageId, productId },
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    await this.storageService.deleteFile(image.storageKey);
    await this.prisma.productImage.delete({ where: { id: imageId } });

    return { message: 'Image removed successfully' };
  }

  async remove(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: { images: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Delete all product images from R2
    const imageDeletePromises = product.images
      .filter((img) => img.storageKey)
      .map((img) => this.storageService.deleteFile(img.storageKey));

    // Delete PDF from R2 if present
    if (product.pdfStorageKey) {
      imageDeletePromises.push(this.storageService.deleteFile(product.pdfStorageKey));
    }

    await Promise.all(imageDeletePromises);

    // Delete image records from DB, then soft-delete the product
    await this.prisma.productImage.deleteMany({ where: { productId: id } });

    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Product deleted successfully' };
  }

  private buildProductImageFolder(sku?: string | null, productId?: string): string {
    const skuPart = this.sanitizeFolderPart(sku);

    if (skuPart) {
      return `products/${skuPart}`;
    }

    return `products/${productId || 'unknown-product'}`;
  }

  private buildProductPdfFolder(sku?: string | null, productId?: string): string {
    return `${this.buildProductImageFolder(sku, productId)}/documents`;
  }

  private ensureValidImageCount(totalCount: number, existingCount = 0): void {
    const newCount = totalCount - existingCount;

    if (existingCount === 0 && totalCount === 0) {
      throw new BadRequestException('At least one product image is required');
    }

    if (newCount <= 0) {
      throw new BadRequestException('Please upload at least one product image');
    }

    if (totalCount > ProductsService.MAX_PRODUCT_IMAGES) {
      throw new BadRequestException(
        `You can upload up to ${ProductsService.MAX_PRODUCT_IMAGES} product images`,
      );
    }
  }

  private sanitizeFolderPart(value?: string | null): string {
    if (!value) {
      return '';
    }

    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private normalizeSku(sku?: string): string {
    const normalized = sku?.trim().toUpperCase();

    if (!normalized) {
      throw new BadRequestException('SKU is required');
    }

    return normalized;
  }

  private async assertSkuUnique(sku: string, excludeProductId?: string): Promise<void> {
    const existingProduct = await this.prisma.product.findFirst({
      where: {
        sku: { equals: sku, mode: 'insensitive' },
        ...(excludeProductId ? { NOT: { id: excludeProductId } } : {}),
      },
      select: { id: true },
    });

    if (existingProduct) {
      throw new BadRequestException(`SKU \"${sku}\" already exists`);
    }
  }

  private withResolvedAssetUrls(product: any) {
    if (!product) {
      return product;
    }

    const resolvedProduct = {
      ...product,
      imageUrl: product.storageKey
        ? this.storageService.getPublicUrl(product.storageKey)
        : product.imageUrl,
      pdfUrl: product.pdfStorageKey
        ? this.storageService.getPublicUrl(product.pdfStorageKey)
        : product.pdfUrl,
    };

    if (!Array.isArray(product.images)) {
      return resolvedProduct;
    }

    return {
      ...resolvedProduct,
      images: product.images.map((image: any) => ({
        ...image,
        imageUrl: image.storageKey
          ? this.storageService.getPublicUrl(image.storageKey)
          : image.imageUrl,
      })),
    };
  }
}
