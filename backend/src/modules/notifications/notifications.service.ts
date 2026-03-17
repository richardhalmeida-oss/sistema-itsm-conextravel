import { Injectable, Inject } from '@nestjs/common';
import { Notification, NotificationType, NotificationStatus } from '@/domain/entities/notification.entity';
import { INotificationRepository, NOTIFICATION_REPOSITORY } from '@/domain/repositories/notification.repository';
import { AuditService } from '@/modules/audit/audit.service';
import { AuditAction } from '@/domain/entities/audit-log.entity';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly notifRepo: INotificationRepository,
    private readonly auditService: AuditService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async findByRecipient(userId: string, options?: any) {
    return this.notifRepo.findByRecipient(userId, options);
  }

  async countUnread(userId: string) {
    return { count: await this.notifRepo.countUnread(userId) };
  }

  async markAsRead(id: string) {
    const notification = await this.notifRepo.findById(id);
    if (notification) {
      notification.markRead();
      await this.notifRepo.update(notification);
    }
  }

  async markAllAsRead(userId: string) {
    await this.notifRepo.markAllAsRead(userId);
  }

  async send(data: {
    type: NotificationType;
    recipientId?: string;
    recipientEmail?: string;
    title: string;
    content: string;
    metadata?: Record<string, unknown>;
  }): Promise<Notification> {
    const notification = new Notification({
      type: data.type,
      recipientId: data.recipientId || null,
      recipientEmail: data.recipientEmail || null,
      title: data.title,
      content: data.content,
      metadata: data.metadata || {},
    });

    const saved = await this.notifRepo.create(notification);

    // For system notifications, mark as sent immediately
    if (data.type === NotificationType.SYSTEM) {
      saved.markSent();
      await this.notifRepo.update(saved);
    }

    // For email/webhook, would be queued via BullMQ
    if (data.type === NotificationType.EMAIL || data.type === NotificationType.WEBHOOK) {
      this.logger.info(`Queuing ${data.type} notification: ${data.title}`, {
        context: 'NotificationsService',
      });
      // In production: queue.add('send-notification', { id: saved.id })
      saved.markSent();
      await this.notifRepo.update(saved);
    }

    await this.auditService.log({
      userId: null,
      userName: 'system',
      action: AuditAction.NOTIFICATION_SENT,
      entity: 'notification',
      entityId: saved.id,
      metadata: { type: data.type, recipientId: data.recipientId },
    });

    return saved;
  }
}
