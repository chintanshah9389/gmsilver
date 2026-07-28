import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalUsers,
      pendingUsers,
      totalProducts,
      activeProducts,
      totalCategories,
      totalOrders,
      pendingOrders,
      approvedOrders,
      completedOrders,
      revenueThisMonth,
      revenueLastMonth,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null, role: 'CUSTOMER' } }),
      this.prisma.user.count({ where: { status: 'PENDING', deletedAt: null } }),
      this.prisma.product.count({ where: { deletedAt: null } }),
      this.prisma.product.count({ where: { deletedAt: null, isActive: true, isAvailable: true } }),
      this.prisma.category.count({ where: { deletedAt: null } }),
      this.prisma.order.count({ where: { deletedAt: null } }),
      this.prisma.order.count({ where: { status: 'PENDING', deletedAt: null } }),
      this.prisma.order.count({ where: { status: 'APPROVED', deletedAt: null } }),
      this.prisma.order.count({ where: { status: 'COMPLETED', deletedAt: null } }),
      this.prisma.order.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startOfMonth },
        },
        _sum: { grandTotal: true },
      }),
      this.prisma.order.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
        _sum: { grandTotal: true },
      }),
    ]);

    const revenueThisMonthVal = Number(revenueThisMonth._sum.grandTotal || 0);
    const revenueLastMonthVal = Number(revenueLastMonth._sum.grandTotal || 0);

    const revenueGrowth =
      revenueLastMonthVal > 0
        ? ((revenueThisMonthVal - revenueLastMonthVal) / revenueLastMonthVal) * 100
        : 0;

    return {
      data: {
        users: { total: totalUsers, pending: pendingUsers },
        products: { total: totalProducts, active: activeProducts },
        categories: totalCategories,
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          approved: approvedOrders,
          completed: completedOrders,
        },
        revenue: {
          thisMonth: revenueThisMonthVal,
          lastMonth: revenueLastMonthVal,
          growth: Math.round(revenueGrowth * 100) / 100,
        },
      },
    };
  }

  async getMostViewedProducts(limit = 10) {
    const results = await this.prisma.auditLog.groupBy({
      by: ['data'],
      where: { action: 'PRODUCT_VIEW' },
      _count: { action: true },
      orderBy: { _count: { action: 'desc' } },
      take: limit,
    });

    // Extract productIds from data field
    const productIds = results
      .map((r) => (r.data as any)?.productId)
      .filter(Boolean);

    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, imageUrl: true, price: true },
    });

    return { data: products };
  }

  async getMostSearchedKeywords(limit = 10) {
    const results = await this.prisma.auditLog.groupBy({
      by: ['data'],
      where: { action: 'SEARCH' },
      _count: { action: true },
      orderBy: { _count: { action: 'desc' } },
      take: limit,
    });

    return {
      data: results.map((r) => ({
        keyword: (r.data as any)?.keyword || '',
        count: r._count.action,
      })),
    };
  }

  async getMostOrderedProducts(limit = 10) {
    const results = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      _count: { productId: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    const productIds = results.map((r) => r.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, imageUrl: true, price: true },
    });

    return {
      data: products.map((p) => ({
        ...p,
        totalOrdered:
          results.find((r) => r.productId === p.id)?._sum.quantity || 0,
      })),
    };
  }

  async getRevenueChart(months = 6) {
    const data = [];

    for (let i = months - 1; i >= 0; i--) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const result = await this.prisma.order.aggregate({
        where: {
          status: { in: ['APPROVED', 'COMPLETED'] },
          createdAt: { gte: start, lte: end },
        },
        _sum: { grandTotal: true },
        _count: { id: true },
      });

      data.push({
        month: start.toLocaleString('default', { month: 'short', year: 'numeric' }),
        revenue: Number(result._sum.grandTotal || 0),
        orders: result._count.id,
      });
    }

    return { data };
  }

  async getActiveUsers(hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const activeUsers = await this.prisma.auditLog.findMany({
      where: {
        userId: { not: null },
        createdAt: { gte: since },
      },
      select: {
        userId: true,
        user: { select: { id: true, name: true, email: true } },
      },
      distinct: ['userId'],
    });

    return { data: activeUsers, count: activeUsers.length };
  }
}
