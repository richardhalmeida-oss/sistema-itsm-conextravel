import { BaseEntity } from './base.entity';

export enum NotificationType {
  EMAIL = 'email',
  SYSTEM = 'system',
  WEBHOOK = 'webhook',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  READ = 'read',
}

/**
 * Notification Domain Entity.
 */
export class Notification extends BaseEntity {
  public type: NotificationType;
  public status: NotificationStatus;
  public recipientId: string | null;
  public recipientEmail: string | null;
  public title: string;
  public content: string;
  public metadata: Record<string, unknown>;
  public sentAt: Date | null;
  public readAt: Date | null;
  public retryCount: number;
  public lastError: string | null;

  constructor(props: {
    id?: string;
    type: NotificationType;
    status?: NotificationStatus;
    recipientId?: string | null;
    recipientEmail?: string | null;
    title: string;
    content: string;
    metadata?: Record<string, unknown>;
    sentAt?: Date | null;
    readAt?: Date | null;
    retryCount?: number;
    lastError?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super(props.id, props.createdAt, props.updatedAt);
    this.type = props.type;
    this.status = props.status || NotificationStatus.PENDING;
    this.recipientId = props.recipientId || null;
    this.recipientEmail = props.recipientEmail || null;
    this.title = props.title;
    this.content = props.content;
    this.metadata = props.metadata || {};
    this.sentAt = props.sentAt || null;
    this.readAt = props.readAt || null;
    this.retryCount = props.retryCount || 0;
    this.lastError = props.lastError || null;
  }

  public markSent(): void {
    this.status = NotificationStatus.SENT;
    this.sentAt = new Date();
    this.markUpdated();
  }

  public markFailed(error: string): void {
    this.status = NotificationStatus.FAILED;
    this.lastError = error;
    this.retryCount += 1;
    this.markUpdated();
  }

  public markRead(): void {
    this.status = NotificationStatus.READ;
    this.readAt = new Date();
    this.markUpdated();
  }

  public canRetry(maxRetries: number = 3): boolean {
    return this.retryCount < maxRetries && this.status === NotificationStatus.FAILED;
  }

  public resetForRetry(): void {
    if (this.canRetry()) {
      this.status = NotificationStatus.PENDING;
      this.markUpdated();
    }
  }
}

/**
 * TicketComment Domain Entity.
 * Comments/interactions on a ticket.
 */
export class TicketComment extends BaseEntity {
  public ticketId: string;
  public authorId: string;
  public content: string;
  public isInternal: boolean; // Internal notes vs customer-facing
  public attachments: AttachmentInfo[];

  constructor(props: {
    id?: string;
    ticketId: string;
    authorId: string;
    content: string;
    isInternal?: boolean;
    attachments?: AttachmentInfo[];
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super(props.id, props.createdAt, props.updatedAt);
    this.ticketId = props.ticketId;
    this.authorId = props.authorId;
    this.content = props.content;
    this.isInternal = props.isInternal || false;
    this.attachments = props.attachments || [];
  }
}

export interface AttachmentInfo {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  uploadedAt: Date;
}
