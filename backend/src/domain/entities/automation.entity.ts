import { BaseEntity } from './base.entity';

export enum AutomationTrigger {
  TICKET_CREATED = 'ticket_created',
  TICKET_UPDATED = 'ticket_updated',
  TICKET_STATUS_CHANGED = 'ticket_status_changed',
  TICKET_ASSIGNED = 'ticket_assigned',
  SLA_BREACH = 'sla_breach',
  SLA_WARNING = 'sla_warning',
  TICKET_IDLE = 'ticket_idle',
  SCHEDULE = 'schedule',
}

export enum AutomationActionType {
  SEND_NOTIFICATION = 'send_notification',
  REASSIGN_TICKET = 'reassign_ticket',
  CHANGE_PRIORITY = 'change_priority',
  CHANGE_STATUS = 'change_status',
  ADD_TAG = 'add_tag',
  ESCALATE = 'escalate',
  SEND_WEBHOOK = 'send_webhook',
  ADD_COMMENT = 'add_comment',
}

export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  IN = 'in',
  NOT_IN = 'not_in',
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null',
}

/**
 * Automation Rule Condition
 */
export interface AutomationCondition {
  field: string; // e.g., 'priority', 'status', 'elapsed_minutes'
  operator: ConditionOperator;
  value: unknown;
}

/**
 * Automation Rule Action
 */
export interface AutomationAction {
  type: AutomationActionType;
  params: Record<string, unknown>;
}

/**
 * Automation Rule Domain Entity.
 * A configurable automation rule (IF conditions THEN actions).
 */
export class AutomationRule extends BaseEntity {
  public name: string;
  public description: string;
  public trigger: AutomationTrigger;
  public conditions: AutomationCondition[];
  public conditionLogic: 'AND' | 'OR';
  public actions: AutomationAction[];
  public isActive: boolean;
  public priority: number; // Execution order
  public executionCount: number;
  public lastExecutedAt: Date | null;
  public createdById: string;

  constructor(props: {
    id?: string;
    name: string;
    description: string;
    trigger: AutomationTrigger;
    conditions: AutomationCondition[];
    conditionLogic?: 'AND' | 'OR';
    actions: AutomationAction[];
    isActive?: boolean;
    priority?: number;
    executionCount?: number;
    lastExecutedAt?: Date | null;
    createdById: string;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super(props.id, props.createdAt, props.updatedAt);
    this.name = props.name;
    this.description = props.description;
    this.trigger = props.trigger;
    this.conditions = props.conditions;
    this.conditionLogic = props.conditionLogic || 'AND';
    this.actions = props.actions;
    this.isActive = props.isActive !== undefined ? props.isActive : true;
    this.priority = props.priority || 0;
    this.executionCount = props.executionCount || 0;
    this.lastExecutedAt = props.lastExecutedAt || null;
    this.createdById = props.createdById;
  }

  /**
   * Evaluate conditions against a context
   */
  public evaluateConditions(context: Record<string, unknown>): boolean {
    if (this.conditions.length === 0) return true;

    const results = this.conditions.map((condition) =>
      this.evaluateCondition(condition, context),
    );

    if (this.conditionLogic === 'AND') {
      return results.every((r) => r);
    }
    return results.some((r) => r);
  }

  private evaluateCondition(
    condition: AutomationCondition,
    context: Record<string, unknown>,
  ): boolean {
    const fieldValue = context[condition.field];

    switch (condition.operator) {
      case ConditionOperator.EQUALS:
        return fieldValue === condition.value;
      case ConditionOperator.NOT_EQUALS:
        return fieldValue !== condition.value;
      case ConditionOperator.CONTAINS:
        return typeof fieldValue === 'string' &&
          fieldValue.includes(String(condition.value));
      case ConditionOperator.GREATER_THAN:
        return Number(fieldValue) > Number(condition.value);
      case ConditionOperator.LESS_THAN:
        return Number(fieldValue) < Number(condition.value);
      case ConditionOperator.IN:
        return Array.isArray(condition.value) &&
          condition.value.includes(fieldValue);
      case ConditionOperator.NOT_IN:
        return Array.isArray(condition.value) &&
          !condition.value.includes(fieldValue);
      case ConditionOperator.IS_NULL:
        return fieldValue === null || fieldValue === undefined;
      case ConditionOperator.IS_NOT_NULL:
        return fieldValue !== null && fieldValue !== undefined;
      default:
        return false;
    }
  }

  /**
   * Record execution
   */
  public recordExecution(): void {
    this.executionCount += 1;
    this.lastExecutedAt = new Date();
    this.markUpdated();
  }
}
