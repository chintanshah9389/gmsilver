import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CartUnit } from '@prisma/client';
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

    const normalizedItems = (cartWithDetails?.items || [])
      .filter((item) => item.product && item.product.isActive)
      .map((item) => ({
        ...item,
        unit: item.unit || CartUnit.PIECES,
        unitAmount: Number(item.unitAmount ?? item.quantity),
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
      where: { id: dto.productId },
    });

    if (!product || !product.isActive) {
      throw new NotFoundException('Product not found');
    }

    if (!product.isAvailable) {
      throw new BadRequestException('Product is out of stock');
    }

    const quantity = Number(dto.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new BadRequestException('Quantity must be a whole number of at least 1');
    }

    const unit = dto.unit === CartUnit.KG ? CartUnit.KG : CartUnit.PIECES;
    const unitAmount =
      dto.unitAmount != null && Number(dto.unitAmount) > 0
        ? Number(dto.unitAmount)
        : unit === CartUnit.KG
          ? Number(product.weight || 0) > 0
            ? (quantity * Number(product.weight)) / 1000
            : quantity
          : quantity;

    const cart = await this.getOrCreateCart(userId);

    const existingItem = await this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId: dto.productId } },
    });

    if (existingItem) {
      const nextQty = existingItem.quantity + quantity;
      const nextUnit = unit;
      const nextUnitAmount =
        nextUnit === CartUnit.KG
          ? Number(existingItem.unit === CartUnit.KG ? existingItem.unitAmount : 0) +
            unitAmount
          : nextQty;

      const updated = await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: nextQty,
          unit: nextUnit,
          unitAmount: nextUnitAmount,
        },
      });
      return { message: 'Cart updated', data: updated };
    }

    const item = await this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: dto.productId,
        quantity,
        unit,
        unitAmount,
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
      include: { product: { select: { weight: true } } },
    });

    if (!item) {
      throw new NotFoundException('Item not found in cart');
    }

    const unit = dto.unit || item.unit || CartUnit.PIECES;
    let unitAmount =
      dto.unitAmount != null && Number(dto.unitAmount) > 0
        ? Number(dto.unitAmount)
        : Number(item.unitAmount ?? dto.quantity);

    if (unit === CartUnit.PIECES) {
      unitAmount = dto.quantity;
    } else if (dto.unitAmount == null) {
      const weightGrams = Number(item.product?.weight || 0);
      unitAmount =
        weightGrams > 0 ? (dto.quantity * weightGrams) / 1000 : dto.quantity;
    }

    const updated = await this.prisma.cartItem.update({
      where: { id: item.id },
      data: {
        quantity: dto.quantity,
        unit,
        unitAmount,
      },
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
