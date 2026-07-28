import { Injectable, NotFoundException } from '@nestjs/common';
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

    return createPaginatedResponse(products, total, page, limit);
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

    return createPaginatedResponse(products, total, page, limit);
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

    return { data: product };
  }

  async create(dto: CreateProductDto, images?: Express.Multer.File[]) {
    let imageUrl: string | undefined;
    let storageKey: string | undefined;

    // Upload primary image (first image)
    if (images && images.length > 0) {
      const primaryUpload = await this.storageService.uploadImage(
        images[0].buffer,
        images[0].originalname,
        images[0].mimetype,
        'products',
      );
      imageUrl = primaryUpload.url;
      storageKey = primaryUpload.storageKey;
    }

    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        price: parseFloat(dto.price),
        weight: dto.weight ? parseFloat(dto.weight) : undefined,
        purity: dto.purity,
        sku: dto.sku,
        categoryId: dto.categoryId,
        imageUrl,
        storageKey,
        isAvailable: dto.isAvailable !== 'false',
        isActive: dto.isActive !== 'false',
      },
    });

    // Upload additional images
    if (images && images.length > 1) {
      const imageUploads = await Promise.all(
        images.slice(1).map((img, index) =>
          this.storageService
            .uploadImage(img.buffer, img.originalname, img.mimetype, 'products')
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

  async update(id: string, dto: UpdateProductDto, image?: Express.Multer.File) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    let imageUrl = product.imageUrl;
    let storageKey = product.storageKey;

    if (image) {
      const uploaded = await this.storageService.replaceFile(
        product.storageKey,
        image.buffer,
        image.originalname,
        image.mimetype,
        'products',
      );
      imageUrl = uploaded.url;
      storageKey = uploaded.storageKey;
    }

    const updateData: any = {
      imageUrl,
      storageKey,
    };

    if (dto.name) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.price) updateData.price = parseFloat(dto.price);
    if (dto.weight) updateData.weight = parseFloat(dto.weight);
    if (dto.purity) updateData.purity = dto.purity;
    if (dto.sku) updateData.sku = dto.sku;
    if (dto.categoryId) updateData.categoryId = dto.categoryId;
    if (dto.isAvailable !== undefined) updateData.isAvailable = dto.isAvailable !== 'false';
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive !== 'false';

    const updated = await this.prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: { select: { id: true, name: true } },
        images: { orderBy: [{ isPrimary: 'desc' }] },
      },
    });

    return { message: 'Product updated successfully', data: updated };
  }

  async addImages(productId: string, images: Express.Multer.File[]) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const imageData = await Promise.all(
      images.map((img, index) =>
        this.storageService
          .uploadImage(img.buffer, img.originalname, img.mimetype, 'products')
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
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Product deleted successfully' };
  }
}
