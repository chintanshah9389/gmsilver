import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import * as admin from 'firebase-admin';
import { createPaginatedResponse } from '../../common/utils/pagination.util';

export type FcmDeliveryResult = {
  firebaseReady: boolean;
  usersTargeted: number;
  tokensTargeted: number;
  successCount: number;
  failureCount: number;
  errors: string[];
  skippedReason?: string;
};

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    if (!admin.apps.length) {
      const projectId = this.configService.get<string>('firebase.projectId');
      const clientEmail = this.configService.get<string>('firebase.clientEmail');
      const privateKey = this.configService.get<string>('firebase.privateKey');

      if (projectId && clientEmail && privateKey) {
        try {
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId,
              clientEmail,
              privateKey,
            }),
          });
          this.logger.log('Firebase Admin initialized');
        } catch (error) {
          this.logger.warn(
            'Firebase init skipped. Credentials appear invalid for this environment.',
          );
        }
      } else {
        this.logger.warn('Firebase credentials not configured');
      }
    }
  }

  private emptyDelivery(
    overrides: Partial<FcmDeliveryResult> = {},
  ): FcmDeliveryResult {
    return {
      firebaseReady: admin.apps.length > 0,
      usersTargeted: 0,
      tokensTargeted: 0,
      successCount: 0,
      failureCount: 0,
      errors: [],
      ...overrides,
    };
  }

  // ─── SEND TO SINGLE USER ──────────────────────────────────────────
  async sendToUser(
    userId: string,
    title: string,
    body: string,
    type: NotificationType,
    data?: Record<string, string>,
    alreadySentTokens?: Set<string>,
  ): Promise<FcmDeliveryResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fcmToken: true },
    });

    if (!user) {
      return this.emptyDelivery({
        skippedReason: 'User not found',
        errors: ['User not found'],
      });
    }

    // Save notification to DB
    const payload: Record<string, string> = {
      ...(data || {}),
      type,
    };

    const notification = await this.prisma.notification.create({
      data: { title, body, type, data: payload },
    });

    await this.prisma.notificationLog.create({
      data: {
        notificationId: notification.id,
        userId,
      },
    });

    if (!user.fcmToken) {
      return this.emptyDelivery({
        usersTargeted: 1,
        skippedReason: 'User has no FCM token',
        errors: ['User has no FCM token'],
      });
    }

    if (alreadySentTokens?.has(user.fcmToken)) {
      return this.emptyDelivery({
        usersTargeted: 1,
        tokensTargeted: 0,
        skippedReason: 'Duplicate device token already notified',
      });
    }

    if (!admin.apps.length) {
      return this.emptyDelivery({
        usersTargeted: 1,
        tokensTargeted: 1,
        skippedReason: 'Firebase Admin not initialized',
        errors: ['Firebase Admin not initialized'],
      });
    }

    alreadySentTokens?.add(user.fcmToken);
    return this.sendFcmMessage(user.fcmToken, title, body, payload, 1);
  }

  // ─── BROADCAST TO ALL ─────────────────────────────────────────────
  async broadcast(
    title: string,
    body: string,
    type: NotificationType,
    data?: Record<string, string>,
  ): Promise<{ message: string; data: FcmDeliveryResult }> {
    const users = await this.prisma.user.findMany({
      where: { status: 'APPROVED', deletedAt: null },
      select: { id: true, fcmToken: true },
    });

    const notification = await this.prisma.notification.create({
      data: { title, body, type, data },
    });

    // Bulk create notification logs
    await this.prisma.notificationLog.createMany({
      data: users.map((u) => ({
        notificationId: notification.id,
        userId: u.id,
      })),
    });

    // Send FCM once per unique device token (same phone can be on multiple users while testing)
    const tokens = [
      ...new Set(
        users.map((u) => u.fcmToken).filter(Boolean) as string[],
      ),
    ];

    if (!admin.apps.length) {
      const delivery = this.emptyDelivery({
        usersTargeted: users.length,
        tokensTargeted: tokens.length,
        skippedReason: 'Firebase Admin not initialized',
        errors: [
          'Firebase Admin not initialized — set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY',
        ],
      });
      this.logger.warn(
        `Broadcast saved for ${users.length} users but FCM skipped: Firebase not ready`,
      );
      return {
        message: 'Notification saved but push was not sent (Firebase not ready)',
        data: delivery,
      };
    }

    if (tokens.length === 0) {
      const delivery = this.emptyDelivery({
        usersTargeted: users.length,
        skippedReason: 'No approved users have an FCM token',
        errors: [
          'No FCM tokens found — users must log in on the mobile app with notifications allowed',
        ],
      });
      this.logger.warn(
        `Broadcast saved for ${users.length} users but no FCM tokens to send`,
      );
      return {
        message: 'Notification saved but no devices to push to',
        data: delivery,
      };
    }

    const delivery = await this.sendFcmMulticast(
      tokens,
      title,
      body,
      data,
      users.length,
    );

    let message: string;
    if (delivery.failureCount === 0) {
      message = `Push sent to ${delivery.successCount} device(s)`;
    } else if (delivery.successCount === 0) {
      message = `Push failed for all ${delivery.failureCount} device(s)`;
    } else {
      message = `Push partially sent: ${delivery.successCount} ok, ${delivery.failureCount} failed`;
    }

    return { message, data: delivery };
  }

  // ─── SEND TO ROLE ─────────────────────────────────────────────────
  async sendToRole(
    role: string,
    title: string,
    body: string,
    type: NotificationType,
    data?: Record<string, string>,
  ) {
    const users = await this.prisma.user.findMany({
      where: { role: role as any, status: 'APPROVED', deletedAt: null },
      select: { id: true, fcmToken: true },
    });

    const sentTokens = new Set<string>();
    for (const user of users) {
      await this.sendToUser(user.id, title, body, type, data, sentTokens);
    }
  }

  // ─── BUSINESS NOTIFICATIONS ───────────────────────────────────────
  async notifyUserApproved(userId: string) {
    const result = await this.sendToUser(
      userId,
      'Account Approved! 🎉',
      'Your permission has been approved. You can now sign in and start exploring our silver catalog.',
      NotificationType.USER_APPROVED,
    );
    if (result.skippedReason || result.failureCount > 0) {
      this.logger.warn(
        `Approval push for ${userId}: targeted=${result.tokensTargeted} ok=${result.successCount} skip=${result.skippedReason || '-'} errors=${result.errors.join('; ') || '-'}`,
      );
    }
    return result;
  }

  async notifyUserRejected(userId: string) {
    return this.sendToUser(
      userId,
      'Account Rejected',
      'Your registration was not approved. Please contact support if you have questions.',
      NotificationType.BROADCAST,
    );
  }

  async notifyUserBlocked(userId: string) {
    return this.sendToUser(
      userId,
      'Account Blocked',
      'Your account has been blocked. Please contact support for more information.',
      NotificationType.BROADCAST,
    );
  }

  async notifyOrderCreated(_ownersAndAdmins: boolean, orderId: string, customerName: string) {
    const title = 'New Order Received 📦';
    const body = `${customerName} has placed a new order. Review and approve it.`;
    const data = { orderId };
    await Promise.all([
      this.sendToRole('ADMIN', title, body, NotificationType.ORDER_CREATED, data),
      this.sendToRole('OWNER', title, body, NotificationType.ORDER_CREATED, data),
    ]);
  }

  async notifyOrderApproved(userId: string, orderId: string, orderNumber?: string) {
    const label = orderNumber ? ` ${orderNumber}` : '';
    return this.sendToUser(
      userId,
      'Order Approved ✅',
      `Your order${label} has been approved and is being processed.`,
      NotificationType.ORDER_APPROVED,
      {
        orderId,
        link: `order:${orderId}`,
      },
    );
  }

  async notifyOrderRejected(
    userId: string,
    orderId: string,
    orderNumber?: string,
    reason?: string,
  ) {
    const label = orderNumber ? ` ${orderNumber}` : '';
    const detail = reason?.trim()
      ? ` Reason: ${reason.trim()}`
      : ' Please contact support for more information.';
    return this.sendToUser(
      userId,
      'Order Rejected ❌',
      `Your order${label} has been rejected.${detail}`,
      NotificationType.ORDER_REJECTED,
      {
        orderId,
        link: `order:${orderId}`,
      },
    );
  }

  async notifyOrderCompleted(userId: string, orderId: string, orderNumber?: string) {
    const label = orderNumber ? ` ${orderNumber}` : '';
    return this.sendToUser(
      userId,
      'Order Completed 🎊',
      `Your order${label} has been completed. Thank you for shopping with GM Silver!`,
      NotificationType.ORDER_COMPLETED,
      {
        orderId,
        link: `order:${orderId}`,
      },
    );
  }

  async broadcastNewProduct(productId: string, productName: string) {
    await this.broadcast(
      'New Product Added ✨',
      `Check out our new product: ${productName}`,
      NotificationType.NEW_PRODUCT,
      { productId },
    );
  }

  async notifyAdminsNewUser(userId: string, userName: string) {
    const title = 'New User Registration 👤';
    const body = `${userName} has registered and is pending approval.`;
    const data = { userId };
    // Notify both ADMIN and OWNER so all staff get the alert
    await Promise.all([
      this.sendToRole('ADMIN', title, body, NotificationType.BROADCAST, data),
      this.sendToRole('OWNER', title, body, NotificationType.BROADCAST, data),
    ]);
  }

  // ─── GET USER NOTIFICATIONS ───────────────────────────────────────
  async getUserNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notificationLog.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          notification: true,
        },
      }),
      this.prisma.notificationLog.count({ where: { userId } }),
      this.prisma.notificationLog.count({ where: { userId, isRead: false } }),
    ]);

    return { notifications, total, unreadCount };
  }

  async getNotificationHistory(page = 1, limit = 100) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 100));
    const skip = (safePage - 1) * safeLimit;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { logs: true } },
        },
      }),
      this.prisma.notification.count(),
    ]);

    const rows = notifications.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      type: n.type,
      data: n.data,
      link:
        n.data && typeof n.data === 'object' && 'link' in (n.data as object)
          ? String((n.data as Record<string, unknown>).link || '')
          : '',
      recipientCount: n._count.logs,
      createdAt: n.createdAt,
    }));

    return createPaginatedResponse(rows, total, safePage, safeLimit);
  }

  async markAsRead(userId: string, notificationLogId: string) {
    await this.prisma.notificationLog.updateMany({
      where: { id: notificationLogId, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notificationLog.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async remove(id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.$transaction([
      this.prisma.notificationLog.deleteMany({ where: { notificationId: id } }),
      this.prisma.notification.delete({ where: { id } }),
    ]);

    return { message: 'Notification deleted', data: { id } };
  }

  async removeMany(ids: string[]) {
    const uniqueIds = Array.from(new Set(ids));
    const existing = await this.prisma.notification.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true },
    });
    const existingIds = existing.map((item) => item.id);
    const existingSet = new Set(existingIds);
    const failed = uniqueIds
      .filter((id) => !existingSet.has(id))
      .map((id) => ({ id, reason: 'Notification not found' }));

    if (existingIds.length > 0) {
      await this.prisma.$transaction([
        this.prisma.notificationLog.deleteMany({
          where: { notificationId: { in: existingIds } },
        }),
        this.prisma.notification.deleteMany({
          where: { id: { in: existingIds } },
        }),
      ]);
    }

    return {
      message: 'Bulk notification delete processed',
      requested: uniqueIds.length,
      deletedCount: existingIds.length,
      failedCount: failed.length,
      deletedIds: existingIds,
      failed,
    };
  }

  // ─── PRIVATE HELPERS ──────────────────────────────────────────────
  private isInvalidTokenError(code?: string): boolean {
    return (
      code === 'messaging/registration-token-not-registered' ||
      code === 'messaging/invalid-registration-token'
    );
  }

  private async clearInvalidFcmTokens(tokens: string[]) {
    if (!tokens.length) return;
    const unique = [...new Set(tokens)];
    const result = await this.prisma.user.updateMany({
      where: { fcmToken: { in: unique } },
      data: { fcmToken: null },
    });
    this.logger.warn(
      `Cleared ${result.count} stale FCM token(s) from users table`,
    );
  }

  private async sendFcmMessage(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
    usersTargeted = 1,
  ): Promise<FcmDeliveryResult> {
    try {
      await admin.messaging().send({
        token,
        notification: { title, body },
        data: data || {},
        android: {
          priority: 'high',
          notification: {
            channelId: 'gmsilver_default',
            sound: 'default',
          },
        },
        apns: { payload: { aps: { sound: 'default', badge: 1 } } },
      });
      return this.emptyDelivery({
        usersTargeted,
        tokensTargeted: 1,
        successCount: 1,
      });
    } catch (err: any) {
      const code = err?.code as string | undefined;
      const errorMessage = code
        ? `${code}: ${err?.message || String(err)}`
        : err?.message || String(err);
      this.logger.error(`FCM send error: ${errorMessage}`);

      if (this.isInvalidTokenError(code)) {
        await this.clearInvalidFcmTokens([token]);
      }

      return this.emptyDelivery({
        usersTargeted,
        tokensTargeted: 1,
        failureCount: 1,
        errors: [errorMessage],
      });
    }
  }

  private async sendFcmMulticast(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
    usersTargeted = tokens.length,
  ): Promise<FcmDeliveryResult> {
    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];
    const invalidTokens: string[] = [];

    try {
      // FCM supports max 500 tokens per batch
      const batchSize = 500;
      for (let i = 0; i < tokens.length; i += batchSize) {
        const batch = tokens.slice(i, i + batchSize);
        const response = await admin.messaging().sendEachForMulticast({
          tokens: batch,
          notification: { title, body },
          data: data || {},
          android: {
            priority: 'high',
            notification: {
              channelId: 'gmsilver_default',
              sound: 'default',
            },
          },
        });

        successCount += response.successCount;
        failureCount += response.failureCount;

        response.responses.forEach((res, index) => {
          if (!res.success && res.error) {
            const code = res.error.code || 'unknown';
            const msg = res.error.message || 'FCM send failed';
            const detail = `${code}: ${msg}`;
            if (errors.length < 10) {
              errors.push(detail);
            }
            this.logger.error(
              `FCM token[${i + index}] failed: ${detail}`,
            );
            if (this.isInvalidTokenError(code)) {
              invalidTokens.push(batch[index]);
            }
          }
        });
      }

      if (invalidTokens.length) {
        await this.clearInvalidFcmTokens(invalidTokens);
      }
    } catch (err: any) {
      const errorMessage = err?.message || String(err);
      this.logger.error(`FCM multicast error: ${errorMessage}`);
      return this.emptyDelivery({
        usersTargeted,
        tokensTargeted: tokens.length,
        failureCount: tokens.length,
        errors: [errorMessage],
      });
    }

    return this.emptyDelivery({
      usersTargeted,
      tokensTargeted: tokens.length,
      successCount,
      failureCount,
      errors,
    });
  }
}
