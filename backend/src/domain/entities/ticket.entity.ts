import { BaseEntity } from './base.entity';

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  WAITING_CLIENT = 'waiting_client',
  WAITING_THIRD_PARTY = 'waiting_third_party',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum TicketType {
  INCIDENT = 'incident',
  REQUEST = 'request',
  PROBLEM = 'problem',
  CHANGE = 'change',
}

/**
 * Ticket Domain Entity.
 * Core entity of the ITSM system.
 */
export class Ticket extends BaseEntity {
  public title: string;
  public description: string;
  public status: TicketStatus;
  public priority: TicketPriority;
  public type: TicketType;
  public categoryId: string | null;
  public createdById: string;
  public assignedToId: string | null;
  public groupId: string | null;
  public slaConfigId: string | null;
  public parentTicketId: string | null;
  public tags: string[];
  public customFields: Record<string, unknown>;
  public resolvedAt: Date | null;
  public closedAt: Date | null;
  public firstResponseAt: Date | null;
  public dueDate: Date | null;

  constructor(props: {
    id?: string;
    title: string;
    description: string;
    status?: TicketStatus;
    priority: TicketPriority;
    type?: TicketType;
    categoryId?: string | null;
    createdById: string;
    assignedToId?: string | null;
    groupId?: string | null;
    slaConfigId?: string | null;
    parentTicketId?: string | null;
    tags?: string[];
    customFields?: Record<string, unknown>;
    resolvedAt?: Date | null;
    closedAt?: Date | null;
    firstResponseAt?: Date | null;
    dueDate?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super(props.id, props.createdAt, props.updatedAt);
    this.title = props.title;
    this.description = props.description;
    this.status = props.status || TicketStatus.OPEN;
    this.priority = props.priority;
    this.type = props.type || TicketType.INCIDENT;
    this.categoryId = props.categoryId || null;
    this.createdById = props.createdById;
    this.assignedToId = props.assignedToId || null;
    this.groupId = props.groupId || null;
    this.slaConfigId = props.slaConfigId || null;
    this.parentTicketId = props.parentTicketId || null;
    this.tags = props.tags || [];
    this.customFields = props.customFields || {};
    this.resolvedAt = props.resolvedAt || null;
    this.closedAt = props.closedAt || null;
    this.firstResponseAt = props.firstResponseAt || null;
    this.dueDate = props.dueDate || null;
  }

  /**
   * Check if ticket is in a terminal state
   */
  public isTerminal(): boolean {
    return [TicketStatus.CLOSED, TicketStatus.CANCELLED].includes(this.status);
  }

  /**
   * Check if SLA should be paused for this status
   */
  public shouldPauseSla(): boolean {
    return [
      TicketStatus.WAITING_CLIENT,
      TicketStatus.WAITING_THIRD_PARTY,
    ].includes(this.status);
  }

  /**
   * Validate and apply status transition
   */
  public transitionTo(newStatus: TicketStatus): void {
    const allowedTransitions: Record<TicketStatus, TicketStatus[]> = {
      [TicketStatus.OPEN]: [
        TicketStatus.IN_PROGRESS,
        TicketStatus.CANCELLED,
      ],
      [TicketStatus.IN_PROGRESS]: [
        TicketStatus.WAITING_CLIENT,
        TicketStatus.WAITING_THIRD_PARTY,
        TicketStatus.RESOLVED,
        TicketStatus.CANCELLED,
      ],
      [TicketStatus.WAITING_CLIENT]: [
        TicketStatus.IN_PROGRESS,
        TicketStatus.CANCELLED,
      ],
      [TicketStatus.WAITING_THIRD_PARTY]: [
        TicketStatus.IN_PROGRESS,
        TicketStatus.CANCELLED,
      ],
      [TicketStatus.RESOLVED]: [
        TicketStatus.IN_PROGRESS,
        TicketStatus.CLOSED,
      ],
      [TicketStatus.CLOSED]: [],
      [TicketStatus.CANCELLED]: [],
    };

    const allowed = allowedTransitions[this.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new Error(
        `Invalid status transition: ${this.status} → ${newStatus}`,
      );
    }

    this.status = newStatus;

    if (newStatus === TicketStatus.RESOLVED) {
      this.resolvedAt = new Date();
    }
    if (newStatus === TicketStatus.CLOSED) {
      this.closedAt = new Date();
    }

    this.markUpdated();
  }

  /**
   * Assign ticket to a user
   */
  public assignTo(userId: string): void {
    if (this.isTerminal()) {
      throw new Error('Cannot assign a closed or cancelled ticket');
    }
    this.assignedToId = userId;

    if (this.status === TicketStatus.OPEN) {
      this.status = TicketStatus.IN_PROGRESS;
    }

    this.markUpdated();
  }

  /**
   * Record first response
   */
  public markFirstResponse(): void {
    if (!this.firstResponseAt) {
      this.firstResponseAt = new Date();
      this.markUpdated();
    }
  }

  /**
   * Check if ticket is a subtask
   */
  public isSubtask(): boolean {
    return this.parentTicketId !== null;
  }

  /**
   * Add a tag
   */
  public addTag(tag: string): void {
    const normalizedTag = tag.toLowerCase().trim();
    if (!this.tags.includes(normalizedTag)) {
      this.tags.push(normalizedTag);
      this.markUpdated();
    }
  }

  /**
   * Remove a tag
   */
  public removeTag(tag: string): void {
    const normalizedTag = tag.toLowerCase().trim();
    this.tags = this.tags.filter((t) => t !== normalizedTag);
    this.markUpdated();
  }

  /**
   * Set custom field value
   */
  public setCustomField(key: string, value: unknown): void {
    this.customFields[key] = value;
    this.markUpdated();
  }

  /**
   * Escalate priority
   */
  public escalatePriority(): void {
    const priorityOrder = [
      TicketPriority.LOW,
      TicketPriority.MEDIUM,
      TicketPriority.HIGH,
      TicketPriority.CRITICAL,
    ];
    const currentIndex = priorityOrder.indexOf(this.priority);
    if (currentIndex < priorityOrder.length - 1) {
      this.priority = priorityOrder[currentIndex + 1];
      this.markUpdated();
    }
  }
}
