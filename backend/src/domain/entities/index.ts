export { BaseEntity } from './base.entity';
export { User, UserStatus } from './user.entity';
export { Role, Permission, Group } from './role.entity';
export {
  Ticket,
  TicketStatus,
  TicketPriority,
  TicketType,
} from './ticket.entity';
export {
  Category,
  TicketTemplate,
} from './category.entity';
export type { CustomFieldDefinition } from './category.entity';
export {
  SlaConfig,
  SlaLog,
  SlaStatus,
  EscalationLevel,
} from './sla.entity';
export type { EscalationRule, EscalationEvent } from './sla.entity';
export { AuditLog, AuditAction } from './audit-log.entity';
export {
  AutomationRule,
  AutomationTrigger,
  AutomationActionType,
  ConditionOperator,
} from './automation.entity';
export type { AutomationCondition, AutomationAction } from './automation.entity';
export {
  Notification,
  NotificationType,
  NotificationStatus,
  TicketComment,
} from './notification.entity';
export type { AttachmentInfo } from './notification.entity';
