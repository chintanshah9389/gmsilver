import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import * as admin from 'firebase-admin';

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
    const notification = await this.prisma.notification.create({
      data: { title, body, type, data },
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
    return this.sendFcmMessage(user.fcmToken, title, body, data, 1);
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
    await this.sendToUser(
      userId,
      'Account Approved! 🎉',
      'Your GM Silver account has been approved. Start exploring our silver catalog.',
      NotificationType.USER_APPROVED,
    );
  }

  async notifyOrderCreated(ownersAndAdmins: boolean, orderId: string, customerName: string) {
    await this.sendToRole(
      'ADMIN',
      'New Order Received 📦',
      `${customerName} has placed a new order. Review and approve it.`,
      NotificationType.ORDER_CREATED,
      { orderId },
    );
    await this.sendToRole(
      'OWNER',
      'New Order Received 📦',
      `${customerName} has placed a new order. Review and approve it.`,
      NotificationType.ORDER_CREATED,
      { orderId },
    );
  }

  async notifyOrderApproved(userId: string, orderId: string) {
    await this.sendToUser(
      userId,
      'Order Approved ✅',
      'Your order has been approved and is being processed.',
      NotificationType.ORDER_APPROVED,
      { orderId },
    );
  }

  async notifyOrderRejected(userId: string, orderId: string) {
    await this.sendToUser(
      userId,
      'Order Rejected ❌',
      'Your order has been rejected. Please contact support for more information.',
      NotificationType.ORDER_REJECTED,
      { orderId },
    );
  }

  async notifyOrderCompleted(userId: string, orderId: string) {
    await this.sendToUser(
      userId,
      'Order Completed 🎊',
      'Your order has been completed. Thank you for shopping with GM Silver!',
      NotificationType.ORDER_COMPLETED,
      { orderId },
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
    await this.sendToRole(
      'ADMIN',
      'New User Registration 👤',
      `${userName} has registered and is pending approval.`,
      NotificationType.BROADCAST,
      { userId },
    );
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

  async getNotificationHistory(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { logs: true } },
        },
      }),
      this.prisma.notification.count(),
    ]);

    return {
      notifications: notifications.map((n) => ({
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
      })),
      total,
    };
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
