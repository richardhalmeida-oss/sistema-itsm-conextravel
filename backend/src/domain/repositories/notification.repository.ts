import { Notification, NotificationStatus } from '../entities/notification.entity';
import { IBaseRepository, FindAllOptions, PaginatedResult } from './base.repository';

export const NOTIFICATION_REPOSITORY = Symbol('NOTIFICATION_REPOSITORY');

export interface INotificationRepository extends IBaseRepository<Notification> {
  findByRecipient(userId: string, options?: FindAllOptions): Promise<PaginatedResult<Notification>>;
  findPending(): Promise<Notification[]>;
  findFailed(): Promise<Notification[]>;
  countUnread(userId: string): Promise<number>;
  markAllAsRead(userId: string): Promise<void>;
}
