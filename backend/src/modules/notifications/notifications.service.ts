import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import * as admin from 'firebase-admin';

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

  // ─── SEND TO SINGLE USER ──────────────────────────────────────────
  async sendToUser(
    userId: string,
    title: string,
    body: string,
    type: NotificationType,
    data?: Record<string, string>,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fcmToken: true },
    });

    if (!user) return;

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

    // Send FCM if token exists
    if (user.fcmToken && admin.apps.length) {
      await this.sendFcmMessage(user.fcmToken, title, body, data);
    }
  }

  // ─── BROADCAST TO ALL ─────────────────────────────────────────────
  async broadcast(
    title: string,
    body: string,
    type: NotificationType,
    data?: Record<string, string>,
  ) {
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

    // Send FCM to all tokens
    const tokens = users
      .map((u) => u.fcmToken)
      .filter(Boolean) as string[];

    if (tokens.length > 0 && admin.apps.length) {
      await this.sendFcmMulticast(tokens, title, body, data);
    }
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

    for (const user of users) {
      await this.sendToUser(user.id, title, body, type, data);
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
  private async sendFcmMessage(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    try {
      await admin.messaging().send({
        token,
        notification: { title, body },
        data: data || {},
        android: { priority: 'high' },
        apns: { payload: { aps: { sound: 'default', badge: 1 } } },
      });
    } catch (err) {
      this.logger.error(`FCM send error: ${err.message}`);
    }
  }

  private async sendFcmMulticast(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    try {
      // FCM supports max 500 tokens per batch
      const batchSize = 500;
      for (let i = 0; i < tokens.length; i += batchSize) {
        const batch = tokens.slice(i, i + batchSize);
        await admin.messaging().sendEachForMulticast({
          tokens: batch,
          notification: { title, body },
          data: data || {},
        });
      }
    } catch (err) {
      this.logger.error(`FCM multicast error: ${err.message}`);
    }
  }
}
