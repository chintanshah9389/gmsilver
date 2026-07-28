import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import {
  getPaginationParams,
  createPaginatedResponse,
} from '../../common/utils/pagination.util';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async findAll(query: any) {
    const { page, limit, skip } = getPaginationParams(query);
    const { search } = query;

    const where: any = { deletedAt: null };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        include: {
          _count: { select: { products: true } },
        },
      }),
      this.prisma.category.count({ where }),
    ]);

    return createPaginatedResponse(categories, total, page, limit);
  }

  async findById(id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return { data: category };
  }

  async create(dto: CreateCategoryDto, image?: Express.Multer.File) {
    const existing = await this.prisma.category.findFirst({
      where: { name: { equals: dto.name, mode: 'insensitive' }, deletedAt: null },
    });

    if (existing) {
      throw new ConflictException('Category with this name already exists');
    }

    let imageUrl: string | undefined;
    let storageKey: string | undefined;

    if (image) {
      const uploaded = await this.storageService.uploadImage(
        image.buffer,
        image.originalname,
        image.mimetype,
        'categories',
      );
      imageUrl = uploaded.url;
      storageKey = uploaded.storageKey;
    }

    const category = await this.prisma.category.create({
      data: {
        ...dto,
        imageUrl,
        storageKey,
      },
    });

    return { message: 'Category created successfully', data: category };
  }

  async update(id: string, dto: UpdateCategoryDto, image?: Express.Multer.File) {
    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    let imageUrl = category.imageUrl;
    let storageKey = category.storageKey;

    if (image) {
      const uploaded = await this.storageService.replaceFile(
        category.storageKey,
        image.buffer,
        image.originalname,
        image.mimetype,
        'categories',
      );
      imageUrl = uploaded.url;
      storageKey = uploaded.storageKey;
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: { ...dto, imageUrl, storageKey },
    });

    return { message: 'Category updated successfully', data: updated };
  }

  async remove(id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    await this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Category deleted successfully' };
  }
}
