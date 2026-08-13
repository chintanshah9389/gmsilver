import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  getPaginationParams,
  createPaginatedResponse,
} from '../../common/utils/pagination.util';

export interface CreateAuditLogDto {
  userId?: string | null;
  action: string;
  module: string;
  data?: any;
  ipAddress?: string;
  userAgent?: string;
  deviceDetails?: any;
}

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAuditLogDto) {
    return this.prisma.auditLog.create({
      data: {
        userId: dto.userId || null,
        action: dto.action,
        module: dto.module,
        data: dto.data || null,
        ipAddress: dto.ipAddress || null,
        userAgent: dto.userAgent || null,
        deviceDetails: dto.deviceDetails || null,
      },
    });
  }

  async findAll(query: any) {
    const { page, limit, skip } = getPaginationParams(query);
    const { userId, action, module: mod, startDate, endDate } = query;

    const where: any = {};

    if (userId) where.userId = userId;
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (mod) where.module = mod;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return createPaginatedResponse(logs, total, page, limit);
  }

  async getUserJourney(userId: string, limit = 50) {
    const logs = await this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        action: true,
        module: true,
        data: true,
        createdAt: true,
      },
    });

    return { data: logs };
  }

  async getActivitySummary(startDate?: Date, endDate?: Date) {
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [
      totalEvents,
      loginCount,
      searchCount,
      productViews,
      cartActivity,
      orderActivity,
    ] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.count({ where: { ...where, action: 'LOGIN' } }),
      this.prisma.auditLog.count({ where: { ...where, action: 'SEARCH' } }),
      this.prisma.auditLog.count({ where: { ...where, action: 'PRODUCT_VIEW' } }),
      this.prisma.auditLog.count({ where: { ...where, module: 'CART' } }),
      this.prisma.auditLog.count({ where: { ...where, module: 'ORDER' } }),
    ]);

    return {
      data: {
        totalEvents,
        loginCount,
        searchCount,
        productViews,
        cartActivity,
        orderActivity,
      },
    };
  }

  async trackEvent(
    userId: string | null,
    action: string,
    module: string,
    data?: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    return this.create({
      userId,
      action,
      module,
      data,
      ipAddress,
      userAgent,
    });
  }

  async remove(id: string) {
    const log = await this.prisma.auditLog.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!log) {
      throw new NotFoundException('Audit log not found');
    }

    await this.prisma.auditLog.delete({ where: { id } });
    return { message: 'Audit log deleted', data: { id } };
  }

  async removeMany(ids: string[]) {
    const uniqueIds = Array.from(new Set(ids));
    const existing = await this.prisma.auditLog.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true },
    });
    const existingIds = existing.map((item) => item.id);
    const existingSet = new Set(existingIds);
    const failed = uniqueIds
      .filter((id) => !existingSet.has(id))
      .map((id) => ({ id, reason: 'Audit log not found' }));

    if (existingIds.length > 0) {
      await this.prisma.auditLog.deleteMany({
        where: { id: { in: existingIds } },
      });
    }

    return {
      message: 'Bulk audit log delete processed',
      requested: uniqueIds.length,
      deletedCount: existingIds.length,
      failedCount: failed.length,
      deletedIds: existingIds,
      failed,
    };
  }
}
