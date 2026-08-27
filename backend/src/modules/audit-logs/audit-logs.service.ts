import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { createPaginatedResponse } from '../../common/utils/pagination.util';

export interface CreateAuditLogDto {
  userId?: string | null;
  action: string;
  module: string;
  data?: any;
  ipAddress?: string;
  userAgent?: string;
  deviceDetails?: any;
}

function parseDateTime(
  date?: string,
  time?: string,
  endOfDay = false,
): Date | undefined {
  if (!date) return undefined;

  const trimmedDate = String(date).trim();
  if (!trimmedDate) return undefined;

  if (trimmedDate.includes('T')) {
    const parsed = new Date(trimmedDate);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  const fallbackTime = endOfDay ? '23:59:59.999' : '00:00:00.000';
  const rawTime = (time || fallbackTime).trim();
  const normalizedTime =
    rawTime.length === 5 ? `${rawTime}:00` : rawTime.length === 8 ? rawTime : rawTime;

  const parsed = new Date(`${trimmedDate}T${normalizedTime}`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
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
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 100));
    const page = Math.max(1, Number(query.page) || 1);
    const skip = (page - 1) * limit;
    const { userId, action, module: mod, search, startDate, endDate, startTime, endTime } =
      query;

    const where: Prisma.AuditLogWhereInput = {};
    const and: Prisma.AuditLogWhereInput[] = [];

    if (userId) {
      where.userId = userId;
    }
    if (action) {
      where.action = { contains: action, mode: 'insensitive' };
    }
    if (mod) {
      where.module = String(mod).toUpperCase();
    }

    const from = parseDateTime(startDate, startTime, false);
    const to = parseDateTime(endDate, endTime, true);
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      };
    }

    if (search) {
      const term = String(search).trim();
      if (term) {
        and.push({
          OR: [
            { action: { contains: term, mode: 'insensitive' } },
            { module: { contains: term, mode: 'insensitive' } },
            { ipAddress: { contains: term, mode: 'insensitive' } },
            { user: { name: { contains: term, mode: 'insensitive' } } },
            { user: { email: { contains: term, mode: 'insensitive' } } },
            { user: { phone: { contains: term, mode: 'insensitive' } } },
          ],
        });
      }
    }

    if (and.length) {
      where.AND = and;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return createPaginatedResponse(logs, total, page, limit);
  }

  async getFilterUsers() {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
      orderBy: { name: 'asc' },
      take: 500,
    });

    return { data: users };
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
        ipAddress: true,
        userAgent: true,
        createdAt: true,
      },
    });

    return { data: logs };
  }

  async getActivitySummary(startDate?: Date, endDate?: Date) {
    const where: Prisma.AuditLogWhereInput = {};
    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate ? { gte: startDate } : {}),
        ...(endDate ? { lte: endDate } : {}),
      };
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
      this.prisma.auditLog.count({ where: { ...where, action: { contains: 'LOGIN' } } }),
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
