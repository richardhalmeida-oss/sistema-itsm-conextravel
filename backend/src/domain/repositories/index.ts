export { IBaseRepository, FindAllOptions, PaginatedResult } from './base.repository';
export { IUserRepository, USER_REPOSITORY } from './user.repository';
export {
  IRoleRepository,
  IPermissionRepository,
  IGroupRepository,
  ROLE_REPOSITORY,
  PERMISSION_REPOSITORY,
  GROUP_REPOSITORY,
} from './role.repository';
export {
  ITicketRepository,
  ITicketCommentRepository,
  TICKET_REPOSITORY,
  TICKET_COMMENT_REPOSITORY,
} from './ticket.repository';
export type { TicketFindAllOptions } from './ticket.repository';
export {
  ISlaConfigRepository,
  ISlaLogRepository,
  SLA_CONFIG_REPOSITORY,
  SLA_LOG_REPOSITORY,
} from './sla.repository';
export {
  IAuditLogRepository,
  AUDIT_LOG_REPOSITORY,
} from './audit.repository';
export type { AuditFindAllOptions } from './audit.repository';
export { IAutomationRepository, AUTOMATION_REPOSITORY } from './automation.repository';
export { INotificationRepository, NOTIFICATION_REPOSITORY } from './notification.repository';
export {
  ICategoryRepository,
  ITicketTemplateRepository,
  CATEGORY_REPOSITORY,
  TICKET_TEMPLATE_REPOSITORY,
} from './category.repository';
