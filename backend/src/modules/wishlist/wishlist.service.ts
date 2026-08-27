import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async getWishlist(userId: string) {
    const items = await this.prisma.wishlist.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            weight: true,
            purity: true,
            sku: true,
            image1Url: true,
            image1StorageKey: true,
            image2Url: true,
            image2StorageKey: true,
            image3Url: true,
            image3StorageKey: true,
            pdfUrl: true,
            pdfStorageKey: true,
            quantity: true,
            isAvailable: true,
            isActive: true,
            categoryId: true,
            createdAt: true,
            updatedAt: true,
            category: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const normalizedItems = items
      .filter((item) => item.product && item.product.isActive)
      .map((item) => ({
      ...item,
      product: {
        ...item.product,
        imageUrl: item.product.image1Url,
        images: [
          item.product.image1Url
            ? {
                imageUrl: item.product.image1Url,
                storageKey: item.product.image1StorageKey,
                isPrimary: true,
                sortOrder: 0,
              }
            : null,
          item.product.image2Url
            ? {
                imageUrl: item.product.image2Url,
                storageKey: item.product.image2StorageKey,
                isPrimary: false,
                sortOrder: 1,
              }
            : null,
          item.product.image3Url
            ? {
                imageUrl: item.product.image3Url,
                storageKey: item.product.image3StorageKey,
                isPrimary: false,
                sortOrder: 2,
              }
            : null,
        ].filter(Boolean),
      },
    }));

    return { data: normalizedItems };
  }

  async addToWishlist(userId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, isActive: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existing = await this.prisma.wishlist.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (existing) {
      return { message: 'Already in wishlist', data: existing };
    }

    const item = await this.prisma.wishlist.create({
      data: { userId, productId },
    });

    return { message: 'Added to wishlist', data: item };
  }

  async removeFromWishlist(userId: string, productId: string) {
    const item = await this.prisma.wishlist.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (!item) {
      throw new NotFoundException('Item not found in wishlist');
    }

    await this.prisma.wishlist.delete({
      where: { userId_productId: { userId, productId } },
    });

    return { message: 'Removed from wishlist' };
  }
}
