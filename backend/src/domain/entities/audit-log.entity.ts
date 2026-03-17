import { BaseEntity } from './base.entity';

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  LOGIN_FAILED = 'login_failed',
  STATUS_CHANGE = 'status_change',
  ASSIGNMENT = 'assignment',
  ESCALATION = 'escalation',
  SLA_BREACH = 'sla_breach',
  SLA_PAUSE = 'sla_pause',
  SLA_RESUME = 'sla_resume',
  PERMISSION_CHANGE = 'permission_change',
  AUTOMATION_TRIGGERED = 'automation_triggered',
  NOTIFICATION_SENT = 'notification_sent',
  EXPORT = 'export',
  IMPORT = 'import',
  CONFIG_CHANGE = 'config_change',
}

/**
 * Audit Log Domain Entity.
 * Records every significant action in the system.
 * Immutable - once created, cannot be modified or deleted.
 */
export class AuditLog extends BaseEntity {
  public readonly userId: string | null;
  public readonly userName: string;
  public readonly action: AuditAction;
  public readonly entity: string; // e.g., 'ticket', 'user', 'sla'
  public readonly entityId: string | null;
  public readonly before: Record<string, unknown> | null;
  public readonly after: Record<string, unknown> | null;
  public readonly metadata: Record<string, unknown>;
  public readonly ipAddress: string | null;
  public readonly userAgent: string | null;

  constructor(props: {
    id?: string;
    userId: string | null;
    userName: string;
    action: AuditAction;
    entity: string;
    entityId?: string | null;
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
    metadata?: Record<string, unknown>;
    ipAddress?: string | null;
    userAgent?: string | null;
    createdAt?: Date;
  }) {
    super(props.id, props.createdAt, props.createdAt);
    this.userId = props.userId;
    this.userName = props.userName;
    this.action = props.action;
    this.entity = props.entity;
    this.entityId = props.entityId || null;
    this.before = props.before || null;
    this.after = props.after || null;
    this.metadata = props.metadata || {};
    this.ipAddress = props.ipAddress || null;
    this.userAgent = props.userAgent || null;
  }

  /**
   * Get a human-readable description of the action
   */
  public getDescription(): string {
    const entityDisplay = this.entityId
      ? `${this.entity}#${this.entityId}`
      : this.entity;
    return `${this.userName} performed ${this.action} on ${entityDisplay}`;
  }
}
