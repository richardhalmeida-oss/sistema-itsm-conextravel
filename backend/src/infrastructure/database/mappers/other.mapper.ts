import { SlaConfig, SlaLog, SlaStatus, EscalationLevel } from '@/domain/entities/sla.entity';
import { AuditLog, AuditAction } from '@/domain/entities/audit-log.entity';
import { AutomationRule, AutomationTrigger, ConditionOperator, AutomationActionType } from '@/domain/entities/automation.entity';
import { Notification, NotificationType, NotificationStatus } from '@/domain/entities/notification.entity';
import { SlaConfigOrmEntity, SlaLogOrmEntity } from '../entities/sla.orm-entity';
import { AuditLogOrmEntity } from '../entities/audit-log.orm-entity';
import { AutomationRuleOrmEntity } from '../entities/automation.orm-entity';
import { NotificationOrmEntity } from '../entities/notification.orm-entity';

export class SlaConfigMapper {
  static toDomain(orm: SlaConfigOrmEntity): SlaConfig {
    return new SlaConfig({
      id: orm.id,
      name: orm.name,
      description: orm.description,
      priority: orm.priority,
      ticketType: orm.ticketType,
      categoryId: orm.categoryId,
      responseTimeMinutes: orm.responseTimeMinutes,
      resolutionTimeMinutes: orm.resolutionTimeMinutes,
      escalationRules: orm.escalationRules as any,
      isActive: orm.isActive,
      isDefault: orm.isDefault,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: SlaConfig): Partial<SlaConfigOrmEntity> {
    return {
      id: domain.id,
      name: domain.name,
      description: domain.description,
      priority: domain.priority,
      ticketType: domain.ticketType,
      categoryId: domain.categoryId,
      responseTimeMinutes: domain.responseTimeMinutes,
      resolutionTimeMinutes: domain.resolutionTimeMinutes,
      escalationRules: domain.escalationRules,
      isActive: domain.isActive,
      isDefault: domain.isDefault,
    };
  }
}

export class SlaLogMapper {
  static toDomain(orm: SlaLogOrmEntity): SlaLog {
    return new SlaLog({
      id: orm.id,
      ticketId: orm.ticketId,
      slaConfigId: orm.slaConfigId,
      status: orm.status as SlaStatus,
      responseDeadline: orm.responseDeadline,
      resolutionDeadline: orm.resolutionDeadline,
      startedAt: orm.startedAt,
      pausedAt: orm.pausedAt,
      totalPausedMinutes: orm.totalPausedMinutes,
      respondedAt: orm.respondedAt,
      resolvedAt: orm.resolvedAt,
      responseBreach: orm.responseBreach,
      resolutionBreach: orm.resolutionBreach,
      currentEscalationLevel: orm.currentEscalationLevel as EscalationLevel,
      escalationHistory: orm.escalationHistory as any,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: SlaLog): Partial<SlaLogOrmEntity> {
    return {
      id: domain.id,
      ticketId: domain.ticketId,
      slaConfigId: domain.slaConfigId,
      status: domain.status,
      responseDeadline: domain.responseDeadline,
      resolutionDeadline: domain.resolutionDeadline,
      startedAt: domain.startedAt,
      pausedAt: domain.pausedAt,
      totalPausedMinutes: domain.totalPausedMinutes,
      respondedAt: domain.respondedAt,
      resolvedAt: domain.resolvedAt,
      responseBreach: domain.responseBreach,
      resolutionBreach: domain.resolutionBreach,
      currentEscalationLevel: domain.currentEscalationLevel,
      escalationHistory: domain.escalationHistory,
    };
  }
}

export class AuditLogMapper {
  static toDomain(orm: AuditLogOrmEntity): AuditLog {
    return new AuditLog({
      id: orm.id,
      userId: orm.userId,
      userName: orm.userName,
      action: orm.action as AuditAction,
      entity: orm.entity,
      entityId: orm.entityId,
      before: orm.before,
      after: orm.after,
      metadata: orm.metadata,
      ipAddress: orm.ipAddress,
      userAgent: orm.userAgent,
      createdAt: orm.createdAt,
    });
  }

  static toOrm(domain: AuditLog): Partial<AuditLogOrmEntity> {
    return {
      id: domain.id,
      userId: domain.userId,
      userName: domain.userName,
      action: domain.action,
      entity: domain.entity,
      entityId: domain.entityId,
      before: domain.before,
      after: domain.after,
      metadata: domain.metadata,
      ipAddress: domain.ipAddress,
      userAgent: domain.userAgent,
    };
  }
}

export class AutomationRuleMapper {
  static toDomain(orm: AutomationRuleOrmEntity): AutomationRule {
    return new AutomationRule({
      id: orm.id,
      name: orm.name,
      description: orm.description,
      trigger: orm.trigger as AutomationTrigger,
      conditions: orm.conditions.map((c) => ({
        field: c.field,
        operator: c.operator as ConditionOperator,
        value: c.value,
      })),
      conditionLogic: orm.conditionLogic as 'AND' | 'OR',
      actions: orm.actions.map((a) => ({
        type: a.type as AutomationActionType,
        params: a.params,
      })),
      isActive: orm.isActive,
      priority: orm.priority,
      executionCount: orm.executionCount,
      lastExecutedAt: orm.lastExecutedAt,
      createdById: orm.createdById,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: AutomationRule): Partial<AutomationRuleOrmEntity> {
    return {
      id: domain.id,
      name: domain.name,
      description: domain.description,
      trigger: domain.trigger,
      conditions: domain.conditions,
      conditionLogic: domain.conditionLogic,
      actions: domain.actions,
      isActive: domain.isActive,
      priority: domain.priority,
      executionCount: domain.executionCount,
      lastExecutedAt: domain.lastExecutedAt,
      createdById: domain.createdById,
    };
  }
}

export class NotificationMapper {
  static toDomain(orm: NotificationOrmEntity): Notification {
    return new Notification({
      id: orm.id,
      type: orm.type as NotificationType,
      status: orm.status as NotificationStatus,
      recipientId: orm.recipientId,
      recipientEmail: orm.recipientEmail,
      title: orm.title,
      content: orm.content,
      metadata: orm.metadata,
      sentAt: orm.sentAt,
      readAt: orm.readAt,
      retryCount: orm.retryCount,
      lastError: orm.lastError,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: Notification): Partial<NotificationOrmEntity> {
    return {
      id: domain.id,
      type: domain.type,
      status: domain.status,
      recipientId: domain.recipientId,
      recipientEmail: domain.recipientEmail,
      title: domain.title,
      content: domain.content,
      metadata: domain.metadata,
      sentAt: domain.sentAt,
      readAt: domain.readAt,
      retryCount: domain.retryCount,
      lastError: domain.lastError,
    };
  }
}
