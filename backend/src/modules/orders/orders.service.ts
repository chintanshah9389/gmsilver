import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService, FcmDeliveryResult } from '../notifications/notifications.service';
import { InvoicesService } from '../invoices/invoices.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus, UserRole } from '@prisma/client';
import {
  getPaginationParams,
  createPaginatedResponse,
} from '../../common/utils/pagination.util';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly invoicesService: InvoicesService,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    // Get user's cart
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Validate all products are available
    for (const item of cart.items) {
      if (!item.product.isAvailable || !item.product.isActive) {
        throw new BadRequestException(
          `Product "${item.product.name}" is no longer available`,
        );
      }
    }

    // Calculate totals
    const totalAmount = cart.items.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0,
    );

    const gstRate = 0.03; // 3% GST on silver
    const gstAmount = totalAmount * gstRate;
    const grandTotal = totalAmount + gstAmount;

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Create order with items
    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        userId,
        totalAmount,
        gstAmount,
        grandTotal,
        notes: dto.notes,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            rate: item.product.price,
            amount: Number(item.product.price) * item.quantity,
          })),
        },
      },
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // Clear cart
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    // Push to admins/owners — do not fail the order if FCM is down
    this.notificationsService
      .notifyOrderCreated(true, order.id, order.user.name)
      .catch((err) =>
        this.logger.error(`New-order push notification failed for ${order.id}`, err),
      );

    return { message: 'Order placed successfully', data: order };
  }

  async getUserOrders(userId: string, query: any) {
    const { page, limit, skip } = getPaginationParams(query);
    const { status } = query;

    const where: any = { userId, deletedAt: null };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, image1Url: true },
              },
            },
          },
          invoice: { select: { id: true, invoiceNumber: true, pdfUrl: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    const normalizedOrders = orders.map((order) => ({
      ...order,
      items: order.items.map((item) => ({
        ...item,
        product: {
          ...item.product,
          imageUrl: item.product.image1Url,
        },
      })),
    }));

    return createPaginatedResponse(normalizedOrders, total, page, limit);
  }

  async getAllOrders(query: any) {
    const { page, limit, skip } = getPaginationParams(query);
    const { status } = query;

    const where: any = { deletedAt: null };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  weight: true,
                  purity: true,
                  image1Url: true,
                },
              },
            },
          },
          invoice: { select: { id: true, invoiceNumber: true, pdfUrl: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    const normalizedOrders = orders.map((order) => ({
      ...order,
      items: order.items.map((item) => ({
        ...item,
        product: {
          ...item.product,
          imageUrl: item.product.image1Url,
        },
      })),
    }));

    return createPaginatedResponse(normalizedOrders, total, page, limit);
  }

  async getOrderById(id: string, user: any) {
    const order = await this.prisma.order.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
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
              },
            },
          },
        },
        invoice: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Customers can only view their own orders
    if (user.role === UserRole.CUSTOMER && order.userId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    const normalizedOrder = {
      ...order,
      items: order.items.map((item) => ({
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
      })),
    };

    return { data: normalizedOrder };
  }

  async updateOrderStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findFirst({
      where: { id, deletedAt: null },
      include: { user: true, items: { include: { product: true } } },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const validTransitions: Record<string, OrderStatus[]> = {
      PENDING: [OrderStatus.APPROVED, OrderStatus.REJECTED],
      APPROVED: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
    };

    const allowedNext = validTransitions[order.status] || [];
    if (!allowedNext.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${dto.status}`,
      );
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: dto.status },
    });

    const push = await this.notifyCustomerOfStatus(
      dto.status,
      order.userId,
      order.id,
      order.orderNumber,
      dto.reason,
    );

    if (dto.status === OrderStatus.APPROVED) {
      try {
        await this.invoicesService.generateInvoice(order.id);
      } catch (error: any) {
        this.logger.error(
          `Invoice generation failed for order ${order.orderNumber}: ${error?.message || error}`,
        );
      }
    }

    return {
      message: `Order status updated to ${dto.status}`,
      data: {
        ...updated,
        push,
      },
    };
  }

  async cancelOrder(id: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be cancelled');
    }

    await this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED },
    });

    return { message: 'Order cancelled successfully' };
  }

  private async notifyCustomerOfStatus(
    status: OrderStatus,
    userId: string,
    orderId: string,
    orderNumber: string,
    reason?: string,
  ): Promise<FcmDeliveryResult | null> {
    try {
      let delivery: FcmDeliveryResult | null = null;

      if (status === OrderStatus.APPROVED) {
        delivery = await this.notificationsService.notifyOrderApproved(
          userId,
          orderId,
          orderNumber,
        );
      } else if (status === OrderStatus.REJECTED) {
        delivery = await this.notificationsService.notifyOrderRejected(
          userId,
          orderId,
          orderNumber,
          reason,
        );
      } else if (status === OrderStatus.COMPLETED) {
        delivery = await this.notificationsService.notifyOrderCompleted(
          userId,
          orderId,
          orderNumber,
        );
      }

      if (delivery?.successCount) {
        this.logger.log(
          `Push sent to customer for order ${orderNumber} (${status})`,
        );
      } else if (delivery) {
        this.logger.warn(
          `Push not delivered for order ${orderNumber} (${status}): ${
            delivery.skippedReason || delivery.errors.join('; ') || 'unknown'
          }`,
        );
      }

      return delivery;
    } catch (error: any) {
      this.logger.error(
        `Failed to notify customer for order ${orderNumber} (${status}): ${
          error?.message || error
        }`,
      );
      return null;
    }
  }

  async remove(id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    await this.prisma.order.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Order deleted', data: { id } };
  }

  async removeMany(ids: string[]) {
    const uniqueIds = Array.from(new Set(ids));
    const existing = await this.prisma.order.findMany({
      where: { id: { in: uniqueIds }, deletedAt: null },
      select: { id: true },
    });
    const existingIds = existing.map((item) => item.id);
    const existingSet = new Set(existingIds);
    const failed = uniqueIds
      .filter((id) => !existingSet.has(id))
      .map((id) => ({ id, reason: 'Order not found' }));

    if (existingIds.length > 0) {
      await this.prisma.order.updateMany({
        where: { id: { in: existingIds } },
        data: { deletedAt: new Date() },
      });
    }

    return {
      message: 'Bulk order delete processed',
      requested: uniqueIds.length,
      deletedCount: existingIds.length,
      failedCount: failed.length,
      deletedIds: existingIds,
      failed,
    };
  }

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const count = await this.prisma.order.count();
    const sequence = String(count + 1).padStart(6, '0');

    return `GMS-${year}${month}${day}-${sequence}`;
  }
}
