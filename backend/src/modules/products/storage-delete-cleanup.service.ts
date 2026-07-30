import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

interface FailedStorageDelete {
  storageKey: string;
  productId?: string;
  reason?: string;
}

@Injectable()
export class StorageDeleteCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StorageDeleteCleanupService.name);
  private readonly intervalMs = 60_000;
  private readonly batchSize = 20;
  private readonly maxAttempts = 10;
  private intervalHandle?: NodeJS.Timeout;
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  onModuleInit() {
    this.intervalHandle = setInterval(() => {
      void this.processPendingDeletes();
    }, this.intervalMs);

    void this.processPendingDeletes();
  }

  onModuleDestroy() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
    }
  }

  async queueFailedDeletes(failedDeletes: FailedStorageDelete[]): Promise<void> {
    if (failedDeletes.length === 0) {
      return;
    }

    await Promise.all(
      failedDeletes.map((failedDelete) =>
        this.prisma.storageDeleteFailure.upsert({
          where: { storageKey: failedDelete.storageKey },
          create: {
            storageKey: failedDelete.storageKey,
            productId: failedDelete.productId,
            lastError: failedDelete.reason?.slice(0, 1000),
            nextRetryAt: new Date(),
          },
          update: {
            productId: failedDelete.productId,
            lastError: failedDelete.reason?.slice(0, 1000),
            nextRetryAt: new Date(),
            processedAt: null,
            processingAt: null,
          },
        }),
      ),
    );
  }

  async listFailures(
    limit = 50,
    mode: 'pending' | 'permanent' | 'all' = 'pending',
    productId?: string,
  ) {
    const safeLimit = Math.min(Math.max(limit, 1), 200);

    const baseWhere =
      mode === 'pending'
        ? {
            processedAt: null,
          }
        : mode === 'permanent'
          ? {
              processedAt: { not: null },
              attempts: { gte: this.maxAttempts },
            }
          : {};

    const where = {
      ...baseWhere,
      ...(productId ? { productId } : {}),
    };

    return this.prisma.storageDeleteFailure.findMany({
      where,
      orderBy: [{ nextRetryAt: 'asc' }, { createdAt: 'desc' }],
      take: safeLimit,
    });
  }

  async getStats(productId?: string) {
    const productFilter = productId ? { productId } : {};

    const [pendingCount, permanentCount, oldestPending] = await Promise.all([
      this.prisma.storageDeleteFailure.count({
        where: {
          processedAt: null,
          ...productFilter,
        },
      }),
      this.prisma.storageDeleteFailure.count({
        where: {
          processedAt: { not: null },
          attempts: { gte: this.maxAttempts },
          ...productFilter,
        },
      }),
      this.prisma.storageDeleteFailure.findFirst({
        where: {
          processedAt: null,
          ...productFilter,
        },
        orderBy: {
          createdAt: 'asc',
        },
        select: {
          id: true,
          storageKey: true,
          productId: true,
          attempts: true,
          createdAt: true,
          nextRetryAt: true,
        },
      }),
    ]);

    return {
      pendingCount,
      permanentCount,
      oldestPending,
    };
  }

  async retryNow(id: string) {
    const record = await this.prisma.storageDeleteFailure.findUnique({
      where: { id },
    });

    if (!record) {
      return null;
    }

    const updated = await this.prisma.storageDeleteFailure.update({
      where: { id },
      data: {
        attempts: 0,
        processedAt: null,
        processingAt: null,
        nextRetryAt: new Date(),
      },
    });

    return updated;
  }

  async runCleanupNow(): Promise<void> {
    await this.processPendingDeletes();
  }

  private async processPendingDeletes(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    try {
      const pending = await this.prisma.storageDeleteFailure.findMany({
        where: {
          processedAt: null,
          attempts: { lt: this.maxAttempts },
          nextRetryAt: { lte: new Date() },
        },
        orderBy: [{ nextRetryAt: 'asc' }, { createdAt: 'asc' }],
        take: this.batchSize,
      });

      for (const record of pending) {
        const claimed = await this.prisma.storageDeleteFailure.updateMany({
          where: {
            id: record.id,
            processedAt: null,
            processingAt: null,
          },
          data: {
            processingAt: new Date(),
          },
        });

        if (claimed.count === 0) {
          continue;
        }

        try {
          await this.storageService.deleteFile(record.storageKey);

          await this.prisma.storageDeleteFailure.update({
            where: { id: record.id },
            data: {
              attempts: { increment: 1 },
              processedAt: new Date(),
              processingAt: null,
              lastError: null,
            },
          });
        } catch (error) {
          const attemptNumber = record.attempts + 1;
          const nextRetryAt = this.getNextRetryTime(attemptNumber);
          const lastError = this.toErrorMessage(error);
          const shouldStopRetrying = attemptNumber >= this.maxAttempts;

          await this.prisma.storageDeleteFailure.update({
            where: { id: record.id },
            data: {
              attempts: attemptNumber,
              lastError,
              nextRetryAt,
              processingAt: null,
              processedAt: shouldStopRetrying ? new Date() : null,
            },
          });

          if (shouldStopRetrying) {
            this.logger.error(
              `Storage cleanup permanently failed for key ${record.storageKey} after ${attemptNumber} attempts: ${lastError}`,
            );
          }
        }
      }
    } finally {
      this.isRunning = false;
    }
  }

  private getNextRetryTime(attemptNumber: number): Date {
    const backoffMinutes = Math.min(60 * Math.pow(2, Math.max(0, attemptNumber - 1)), 24 * 60);
    return new Date(Date.now() + backoffMinutes * 60_000);
  }

  private toErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message.slice(0, 1000);
    }

    return String(error).slice(0, 1000);
  }
}
