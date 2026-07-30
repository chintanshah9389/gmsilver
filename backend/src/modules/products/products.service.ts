import 'multer';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { NotificationsService } from '../notifications/notifications.service';
import { StorageDeleteCleanupService } from './storage-delete-cleanup.service';
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
    private readonly storageDeleteCleanupService: StorageDeleteCleanupService,
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
    if (images.length === 0) {
      throw new BadRequestException('At least one product image is required');
    }

    if (images.length > ProductsService.MAX_PRODUCT_IMAGES) {
      throw new BadRequestException(
        `You can upload up to ${ProductsService.MAX_PRODUCT_IMAGES} product images`,
      );
    }

    const normalizedSku = this.normalizeSku(dto.sku);
    await this.assertSkuUnique(normalizedSku);
    const parsedQuantity = dto.quantity !== undefined ? Number.parseInt(dto.quantity, 10) : 0;

    if (Number.isNaN(parsedQuantity) || parsedQuantity < 0) {
      throw new BadRequestException('Quantity must be a non-negative number');
    }

    // Create product first to get ID for folder naming
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

    // Upload all images in parallel
    const imageUploads = await Promise.all(
      images.map((img) =>
        this.storageService.uploadImage(img.buffer, img.originalname, img.mimetype, imageFolder),
      ),
    );

    let pdfUpload: { url: string; storageKey: string } | undefined;
    if (pdf) {
      pdfUpload = await this.storageService.uploadPdf(pdf.buffer, pdf.originalname, pdfFolder);
    }

    await this.prisma.product.update({
      where: { id: product.id },
      data: {
        image1Url: imageUploads[0]?.url,
        image1StorageKey: imageUploads[0]?.storageKey,
        image2Url: imageUploads[1]?.url ?? null,
        image2StorageKey: imageUploads[1]?.storageKey ?? null,
        image3Url: imageUploads[2]?.url ?? null,
        image3StorageKey: imageUploads[2]?.storageKey ?? null,
        pdfUrl: pdfUpload?.url ?? null,
        pdfStorageKey: pdfUpload?.storageKey ?? null,
      },
    });

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

    if (images.length > ProductsService.MAX_PRODUCT_IMAGES) {
      throw new BadRequestException(
        `You can upload up to ${ProductsService.MAX_PRODUCT_IMAGES} product images`,
      );
    }

    const effectiveSku = dto.sku ? this.normalizeSku(dto.sku) : product.sku;
    const imageFolder = this.buildProductImageFolder(effectiveSku, product.id);
    const pdfFolder = this.buildProductPdfFolder(effectiveSku, product.id);
    const productWithAssets = product as any;

    const updateData: any = {};

    // Replace image slots starting from slot 1 for each provided image
    if (images.length > 0) {
      const slots = [
        {
          urlKey: 'image1Url',
          keyKey: 'image1StorageKey',
          existingKey: productWithAssets.image1StorageKey,
        },
        {
          urlKey: 'image2Url',
          keyKey: 'image2StorageKey',
          existingKey: productWithAssets.image2StorageKey,
        },
        {
          urlKey: 'image3Url',
          keyKey: 'image3StorageKey',
          existingKey: productWithAssets.image3StorageKey,
        },
      ];

      const imageUploads = await Promise.all(
        images.map((img, i) => {
          const existingKey = slots[i]?.existingKey;
          return existingKey
            ? this.storageService.replaceImage(
                existingKey,
                img.buffer,
                img.originalname,
                img.mimetype,
                imageFolder,
              )
            : this.storageService.uploadImage(
                img.buffer,
                img.originalname,
                img.mimetype,
                imageFolder,
              );
        }),
      );

      imageUploads.forEach((upload, i) => {
        updateData[slots[i].urlKey] = upload.url;
        updateData[slots[i].keyKey] = upload.storageKey;
      });
    }

    if (pdf) {
      const pdfResult = product.pdfStorageKey
        ? await this.storageService.replacePdf(
            product.pdfStorageKey,
            pdf.buffer,
            pdf.originalname,
            pdfFolder,
          )
        : await this.storageService.uploadPdf(pdf.buffer, pdf.originalname, pdfFolder);
      updateData.pdfUrl = pdfResult.url;
      updateData.pdfStorageKey = pdfResult.storageKey;
    }

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
      },
    });

    return {
      message: 'Product updated successfully',
      data: this.withResolvedAssetUrls(updated),
    };
  }

  async remove(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const productWithAssets = product as any;

    const storageKeys = Array.from(
      new Set(
        [
          productWithAssets.image1StorageKey,
          productWithAssets.image2StorageKey,
          productWithAssets.image3StorageKey,
          productWithAssets.pdfStorageKey,
        ].filter((key): key is string => Boolean(key)),
      ),
    );

    await this.prisma.$transaction([
      this.prisma.wishlist.deleteMany({ where: { productId: id } }),
      this.prisma.cartItem.deleteMany({ where: { productId: id } }),
      this.prisma.orderItem.deleteMany({ where: { productId: id } }),
      this.prisma.product.delete({ where: { id } }),
    ]);

    const deleteResults = await Promise.allSettled(
      storageKeys.map((key) => this.storageService.deleteFile(key)),
    );

    const failedDeletes = deleteResults.flatMap((result, index) => {
      if (result.status === 'rejected') {
        return [
          {
            storageKey: storageKeys[index],
            productId: id,
            reason: this.getErrorMessage(result.reason),
          },
        ];
      }

      return [];
    });

    if (failedDeletes.length > 0) {
      await this.storageDeleteCleanupService.queueFailedDeletes(failedDeletes);
    }

    return { message: 'Product deleted successfully' };
  }

  async removeMany(ids: string[]) {
    const uniqueIds = Array.from(new Set(ids));
    const deletedIds: string[] = [];
    const failed: Array<{ id: string; reason: string }> = [];

    for (const id of uniqueIds) {
      try {
        await this.remove(id);
        deletedIds.push(id);
      } catch (error: any) {
        failed.push({
          id,
          reason: error?.message || 'Failed to delete product',
        });
      }
    }

    return {
      message: 'Bulk product delete processed',
      requested: uniqueIds.length,
      deletedCount: deletedIds.length,
      failedCount: failed.length,
      deletedIds,
      failed,
    };
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
      throw new BadRequestException(`SKU "${sku}" already exists`);
    }
  }

  private withResolvedAssetUrls(product: any) {
    if (!product) {
      return product;
    }

    const resolveUrl = (storageKey?: string | null, fallbackUrl?: string | null) =>
      storageKey ? this.storageService.getPublicUrl(storageKey) : (fallbackUrl ?? null);

    const image1Url = resolveUrl(product.image1StorageKey, product.image1Url);
    const image2Url = resolveUrl(product.image2StorageKey, product.image2Url);
    const image3Url = resolveUrl(product.image3StorageKey, product.image3Url);
    const pdfUrl = resolveUrl(product.pdfStorageKey, product.pdfUrl);

    // Build images array for client convenience
    const images = [
      image1Url ? { slot: 1, url: image1Url } : null,
      image2Url ? { slot: 2, url: image2Url } : null,
      image3Url ? { slot: 3, url: image3Url } : null,
    ].filter(Boolean);

    return {
      ...product,
      image1Url,
      image2Url,
      image3Url,
      pdfUrl,
      images,
    };
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }
}
