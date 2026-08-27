import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

import {
  getPaginationParams,
  createPaginatedResponse,
} from '../../common/utils/pagination.util';

@Injectable()
export class BannersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async findAll(
    activeOnly = false,
    query: { page?: string | number; limit?: string | number } = {},
  ) {
    const where: any = { deletedAt: null };
    if (activeOnly) {
      where.isActive = true;
    }

    const wantsPagination = query.page !== undefined || query.limit !== undefined;

    if (!wantsPagination) {
      const banners = await this.prisma.banner.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      });
      return { data: banners };
    }

    const { page, limit, skip } = getPaginationParams(query);
    const [banners, total] = await Promise.all([
      this.prisma.banner.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.banner.count({ where }),
    ]);

    return createPaginatedResponse(banners, total, page, limit);
  }

  async findById(id: string) {
    const banner = await this.prisma.banner.findFirst({
      where: { id, deletedAt: null },
    });

    if (!banner) {
      throw new NotFoundException('Banner not found');
    }

    return { data: banner };
  }

  async create(dto: CreateBannerDto, image?: Express.Multer.File) {
    let imageUrl: string | undefined;
    let imageStorageKey: string | undefined;

    if (image) {
      const uploaded = await this.storageService.uploadImage(
        image.buffer,
        image.originalname,
        image.mimetype,
        'banners',
      );
      imageUrl = uploaded.url;
      imageStorageKey = uploaded.storageKey;
    }

    const banner = await this.prisma.banner.create({
      data: {
        title: dto.title,
        subtitle: dto.subtitle,
        badgeLabel: dto.badgeLabel,
        linkType: dto.linkType,
        linkId: dto.linkId,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
        imageUrl,
        imageStorageKey,
      },
    });

    return { message: 'Banner created successfully', data: banner };
  }

  async update(id: string, dto: UpdateBannerDto, image?: Express.Multer.File) {
    const banner = await this.prisma.banner.findFirst({
      where: { id, deletedAt: null },
    });

    if (!banner) {
      throw new NotFoundException('Banner not found');
    }

    let imageUrl = banner.imageUrl ?? undefined;
    let imageStorageKey = banner.imageStorageKey ?? undefined;

    if (image) {
      // Delete old image
      if (banner.imageStorageKey) {
        await this.storageService.deleteFile(banner.imageStorageKey).catch(() => null);
      }

      const uploaded = await this.storageService.uploadImage(
        image.buffer,
        image.originalname,
        image.mimetype,
        'banners',
      );
      imageUrl = uploaded.url;
      imageStorageKey = uploaded.storageKey;
    }

    const updated = await this.prisma.banner.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.subtitle !== undefined && { subtitle: dto.subtitle }),
        ...(dto.badgeLabel !== undefined && { badgeLabel: dto.badgeLabel }),
        ...(dto.linkType !== undefined && { linkType: dto.linkType }),
        ...(dto.linkId !== undefined && { linkId: dto.linkId }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        imageUrl,
        imageStorageKey,
      },
    });

    return { message: 'Banner updated successfully', data: updated };
  }

  async remove(id: string) {
    const banner = await this.prisma.banner.findFirst({
      where: { id, deletedAt: null },
    });

    if (!banner) {
      throw new NotFoundException('Banner not found');
    }

    if (banner.imageStorageKey) {
      await this.storageService.deleteFile(banner.imageStorageKey).catch(() => null);
    }

    await this.prisma.banner.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Banner deleted successfully' };
  }
}
