import { BaseEntity } from './base.entity';

export enum SlaStatus {
  RUNNING = 'running',
  PAUSED = 'paused',
  BREACHED = 'breached',
  COMPLETED = 'completed',
}

export enum EscalationLevel {
  LEVEL_1 = 1, // Technician
  LEVEL_2 = 2, // Supervisor
  LEVEL_3 = 3, // Admin
}

/**
 * SLA Configuration Domain Entity.
 * Defines SLA rules based on priority, type, and client.
 */
export class SlaConfig extends BaseEntity {
  public name: string;
  public description: string;
  public priority: string | null; // null = applies to all priorities
  public ticketType: string | null;
  public categoryId: string | null;
  public responseTimeMinutes: number; // Time to first response
  public resolutionTimeMinutes: number; // Time to resolution
  public escalationRules: EscalationRule[];
  public isActive: boolean;
  public isDefault: boolean;

  constructor(props: {
    id?: string;
    name: string;
    description: string;
    priority?: string | null;
    ticketType?: string | null;
    categoryId?: string | null;
    responseTimeMinutes: number;
    resolutionTimeMinutes: number;
    escalationRules?: EscalationRule[];
    isActive?: boolean;
    isDefault?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super(props.id, props.createdAt, props.updatedAt);
    this.name = props.name;
    this.description = props.description;
    this.priority = props.priority || null;
    this.ticketType = props.ticketType || null;
    this.categoryId = props.categoryId || null;
    this.responseTimeMinutes = props.responseTimeMinutes;
    this.resolutionTimeMinutes = props.resolutionTimeMinutes;
    this.escalationRules = props.escalationRules || [];
    this.isActive = props.isActive !== undefined ? props.isActive : true;
    this.isDefault = props.isDefault || false;
  }

  /**
   * Check if this SLA config matches the ticket criteria
   */
  public matchesTicket(priority: string, type: string, categoryId: string | null): boolean {
    if (this.priority && this.priority !== priority) return false;
    if (this.ticketType && this.ticketType !== type) return false;
    if (this.categoryId && this.categoryId !== categoryId) return false;
    return true;
  }
}

/**
 * Escalation rule definition
 */
export interface EscalationRule {
  level: EscalationLevel;
  triggerAfterMinutes: number; // Minutes after SLA start
  notifyUserIds: string[];
  notifyGroupIds: string[];
  autoReassign: boolean;
  reassignToUserId?: string;
  reassignToGroupId?: string;
}

/**
 * SLA Log Domain Entity.
 * Tracks SLA timer for individual tickets.
 */
export class SlaLog extends BaseEntity {
  public ticketId: string;
  public slaConfigId: string;
  public status: SlaStatus;
  public responseDeadline: Date;
  public resolutionDeadline: Date;
  public startedAt: Date;
  public pausedAt: Date | null;
  public totalPausedMinutes: number;
  public respondedAt: Date | null;
  public resolvedAt: Date | null;
  public responseBreach: boolean;
  public resolutionBreach: boolean;
  public currentEscalationLevel: EscalationLevel;
  public escalationHistory: EscalationEvent[];

  constructor(props: {
    id?: string;
    ticketId: string;
    slaConfigId: string;
    status?: SlaStatus;
    responseDeadline: Date;
    resolutionDeadline: Date;
    startedAt?: Date;
    pausedAt?: Date | null;
    totalPausedMinutes?: number;
    respondedAt?: Date | null;
    resolvedAt?: Date | null;
    responseBreach?: boolean;
    resolutionBreach?: boolean;
    currentEscalationLevel?: EscalationLevel;
    escalationHistory?: EscalationEvent[];
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super(props.id, props.createdAt, props.updatedAt);
    this.ticketId = props.ticketId;
    this.slaConfigId = props.slaConfigId;
    this.status = props.status || SlaStatus.RUNNING;
    this.responseDeadline = props.responseDeadline;
    this.resolutionDeadline = props.resolutionDeadline;
    this.startedAt = props.startedAt || new Date();
    this.pausedAt = props.pausedAt || null;
    this.totalPausedMinutes = props.totalPausedMinutes || 0;
    this.respondedAt = props.respondedAt || null;
    this.resolvedAt = props.resolvedAt || null;
    this.responseBreach = props.responseBreach || false;
    this.resolutionBreach = props.resolutionBreach || false;
    this.currentEscalationLevel = props.currentEscalationLevel || EscalationLevel.LEVEL_1;
    this.escalationHistory = props.escalationHistory || [];
  }

  /**
   * Pause SLA timer (e.g., waiting for client)
   */
  public pause(): void {
    if (this.status !== SlaStatus.RUNNING) {
      throw new Error(`Cannot pause SLA in status: ${this.status}`);
    }
    this.status = SlaStatus.PAUSED;
    this.pausedAt = new Date();
    this.markUpdated();
  }

  /**
   * Resume SLA timer
   */
  public resume(): void {
    if (this.status !== SlaStatus.PAUSED || !this.pausedAt) {
      throw new Error(`Cannot resume SLA in status: ${this.status}`);
    }
    const pausedDuration = (new Date().getTime() - this.pausedAt.getTime()) / (1000 * 60);
    this.totalPausedMinutes += pausedDuration;

    // Adjust deadlines by the paused duration
    this.responseDeadline = new Date(
      this.responseDeadline.getTime() + pausedDuration * 60 * 1000,
    );
    this.resolutionDeadline = new Date(
      this.resolutionDeadline.getTime() + pausedDuration * 60 * 1000,
    );

    this.status = SlaStatus.RUNNING;
    this.pausedAt = null;
    this.markUpdated();
  }

  /**
   * Record first response
   */
  public recordResponse(): void {
    if (!this.respondedAt) {
      this.respondedAt = new Date();
      if (this.respondedAt > this.responseDeadline) {
        this.responseBreach = true;
      }
      this.markUpdated();
    }
  }

  /**
   * Record resolution
   */
  public recordResolution(): void {
    this.resolvedAt = new Date();
    if (this.resolvedAt > this.resolutionDeadline) {
      this.resolutionBreach = true;
      this.status = SlaStatus.BREACHED;
    } else {
      this.status = SlaStatus.COMPLETED;
    }
    this.markUpdated();
  }

  /**
   * Check and mark breach
   */
  public checkBreach(): boolean {
    const now = new Date();
    if (this.status === SlaStatus.PAUSED) return false;

    let breached = false;

    if (!this.respondedAt && now > this.responseDeadline) {
      this.responseBreach = true;
      breached = true;
    }

    if (!this.resolvedAt && now > this.resolutionDeadline) {
      this.resolutionBreach = true;
      this.status = SlaStatus.BREACHED;
      breached = true;
    }

    if (breached) {
      this.markUpdated();
    }

    return breached;
  }

  /**
   * Escalate to next level
   */
  public escalate(reason: string): void {
    if (this.currentEscalationLevel < EscalationLevel.LEVEL_3) {
      const previousLevel = this.currentEscalationLevel;
      this.currentEscalationLevel = (this.currentEscalationLevel + 1) as EscalationLevel;

      this.escalationHistory.push({
        fromLevel: previousLevel,
        toLevel: this.currentEscalationLevel,
        reason,
        escalatedAt: new Date(),
      });

      this.markUpdated();
    }
  }

  /**
   * Get elapsed time in minutes (excluding paused time)
   */
  public getElapsedMinutes(): number {
    const now = this.status === SlaStatus.PAUSED && this.pausedAt ? this.pausedAt : new Date();
    const totalMinutes = (now.getTime() - this.startedAt.getTime()) / (1000 * 60);
    return totalMinutes - this.totalPausedMinutes;
  }

  /**
   * Get remaining time until resolution deadline in minutes
   */
  public getRemainingMinutes(): number {
    if (this.status === SlaStatus.COMPLETED || this.status === SlaStatus.BREACHED) {
      return 0;
    }
    const now = new Date();
    return (this.resolutionDeadline.getTime() - now.getTime()) / (1000 * 60);
  }
}

/**
 * Escalation event record
 */
export interface EscalationEvent {
  fromLevel: EscalationLevel;
  toLevel: EscalationLevel;
  reason: string;
  escalatedAt: Date;
}
