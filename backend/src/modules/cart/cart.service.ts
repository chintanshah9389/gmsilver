import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);

    const cartWithDetails = await this.prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
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
        },
      },
    });

    const normalizedItems = (cartWithDetails?.items || []).map((item) => ({
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

    const subtotal = normalizedItems.reduce((sum, item) => {
      return sum + Number(item.product.price) * item.quantity;
    }, 0);

    return {
      data: {
        ...cartWithDetails,
        items: normalizedItems,
        subtotal,
        itemCount: normalizedItems.length,
        totalQuantity: normalizedItems.reduce(
          (sum, item) => sum + item.quantity,
          0,
        ),
      },
    };
  }

  async addItem(userId: string, dto: AddToCartDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, isActive: true, isAvailable: true },
    });

    if (!product) {
      throw new NotFoundException('Product is out of stock or unavailable');
    }

    if (dto.quantity < 1) {
      throw new BadRequestException('Quantity must be at least 1');
    }

    const cart = await this.getOrCreateCart(userId);

    const existingItem = await this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId: dto.productId } },
    });

    if (existingItem) {
      const updated = await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + dto.quantity },
      });
      return { message: 'Cart updated', data: updated };
    }

    const item = await this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: dto.productId,
        quantity: dto.quantity,
      },
    });

    return { message: 'Item added to cart', data: item };
  }

  async updateItem(userId: string, productId: string, dto: UpdateCartItemDto) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    if (dto.quantity === 0) {
      return this.removeItem(userId, productId);
    }

    const item = await this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });

    if (!item) {
      throw new NotFoundException('Item not found in cart');
    }

    const updated = await this.prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: dto.quantity },
    });

    return { message: 'Cart item updated', data: updated };
  }

  async removeItem(userId: string, productId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const item = await this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });

    if (!item) {
      throw new NotFoundException('Item not found in cart');
    }

    await this.prisma.cartItem.delete({ where: { id: item.id } });

    return { message: 'Item removed from cart' };
  }

  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });

    if (cart) {
      await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }

    return { message: 'Cart cleared' };
  }

  async getOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({ where: { userId } });

    if (!cart) {
      cart = await this.prisma.cart.create({ data: { userId } });
    }

    return cart;
  }
}
