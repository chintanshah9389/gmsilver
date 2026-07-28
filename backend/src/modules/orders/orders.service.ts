import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
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

    // Send notification to admins/owners
    await this.notificationsService.notifyOrderCreated(
      true,
      order.id,
      order.user.name,
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
                select: { id: true, name: true, imageUrl: true },
              },
            },
          },
          invoice: { select: { id: true, invoiceNumber: true, pdfUrl: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return createPaginatedResponse(orders, total, page, limit);
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
            include: { product: { select: { id: true, name: true, imageUrl: true } } },
          },
          invoice: { select: { id: true, invoiceNumber: true, pdfUrl: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return createPaginatedResponse(orders, total, page, limit);
  }

  async getOrderById(id: string, user: any) {
    const order = await this.prisma.order.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: {
          include: {
            product: { include: { images: { take: 1 } } },
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

    return { data: order };
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

    // Send notifications & generate invoice
    if (dto.status === OrderStatus.APPROVED) {
      await this.notificationsService.notifyOrderApproved(order.userId, id);
      await this.invoicesService.generateInvoice(order.id);
    } else if (dto.status === OrderStatus.REJECTED) {
      await this.notificationsService.notifyOrderRejected(order.userId, id);
    } else if (dto.status === OrderStatus.COMPLETED) {
      await this.notificationsService.notifyOrderCompleted(order.userId, id);
    }

    return {
      message: `Order status updated to ${dto.status}`,
      data: updated,
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
