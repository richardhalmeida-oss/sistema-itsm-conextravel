import { Injectable, Inject } from '@nestjs/common';
import { AutomationRule, AutomationTrigger } from '@/domain/entities/automation.entity';
import { IAutomationRepository, AUTOMATION_REPOSITORY } from '@/domain/repositories/automation.repository';
import { AuditService } from '@/modules/audit/audit.service';
import { AuditAction } from '@/domain/entities/audit-log.entity';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class AutomationService {
  constructor(
    @Inject(AUTOMATION_REPOSITORY) private readonly automationRepo: IAutomationRepository,
    private readonly auditService: AuditService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async findAll() {
    return this.automationRepo.findAll();
  }

  async findById(id: string) {
    return this.automationRepo.findById(id);
  }

  async create(data: any, actorId: string, actorName: string) {
    const rule = new AutomationRule({
      name: data.name,
      description: data.description,
      trigger: data.trigger,
      conditions: data.conditions || [],
      conditionLogic: data.conditionLogic || 'AND',
      actions: data.actions || [],
      isActive: data.isActive !== undefined ? data.isActive : true,
      priority: data.priority || 0,
      createdById: actorId,
    });

    const saved = await this.automationRepo.create(rule);

    await this.auditService.log({
      userId: actorId,
      userName: actorName,
      action: AuditAction.CREATE,
      entity: 'automation_rule',
      entityId: saved.id,
      after: { name: saved.name, trigger: saved.trigger },
    });

    return saved;
  }

  async update(id: string, data: any, actorId: string, actorName: string) {
    const rule = await this.automationRepo.findById(id);
    if (!rule) throw new Error('Automation rule not found');

    Object.assign(rule, data);
    rule.markUpdated();
    const updated = await this.automationRepo.update(rule);

    await this.auditService.log({
      userId: actorId,
      userName: actorName,
      action: AuditAction.UPDATE,
      entity: 'automation_rule',
      entityId: id,
    });

    return updated;
  }

  async delete(id: string, actorId: string, actorName: string) {
    await this.automationRepo.delete(id);

    await this.auditService.log({
      userId: actorId,
      userName: actorName,
      action: AuditAction.DELETE,
      entity: 'automation_rule',
      entityId: id,
    });
  }

  /**
   * Execute automation rules for a given trigger and context.
   * Called by the system when events occur (e.g., ticket created/updated).
   */
  async executeRules(trigger: AutomationTrigger, context: Record<string, unknown>): Promise<void> {
    try {
      const rules = await this.automationRepo.findByTrigger(trigger);

      for (const rule of rules) {
        try {
          if (rule.evaluateConditions(context)) {
            this.logger.info(`Automation rule "${rule.name}" matched for trigger "${trigger}"`, {
              context: 'AutomationService',
              ruleId: rule.id,
            });

            for (const action of rule.actions) {
              await this.executeAction(action, context);
            }

            rule.recordExecution();
            await this.automationRepo.update(rule);

            await this.auditService.log({
              userId: null,
              userName: 'system',
              action: AuditAction.AUTOMATION_TRIGGERED,
              entity: 'automation_rule',
              entityId: rule.id,
              metadata: {
                trigger,
                ruleName: rule.name,
                context: Object.keys(context),
              },
            });
          }
        } catch (error) {
          this.logger.error(`Automation rule "${rule.name}" failed: ${error instanceof Error ? error.message : 'unknown'}`, {
            context: 'AutomationService',
            ruleId: rule.id,
          });
        }
      }
    } catch (error) {
      this.logger.error(`Failed to execute automation rules for trigger ${trigger}`, {
        context: 'AutomationService',
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  private async executeAction(
    action: import('@/domain/entities/automation.entity').AutomationAction,
    context: Record<string, unknown>,
  ): Promise<void> {
    // Action execution is handled here.
    // Each action type maps to a specific handler.
    this.logger.info(`Executing automation action: ${action.type}`, {
      context: 'AutomationService',
      params: action.params,
    });

    switch (action.type) {
      case 'send_notification':
        // Would integrate with NotificationsService
        this.logger.info('Notification action triggered', { context: 'AutomationService' });
        break;
      case 'change_priority':
        // Would integrate with TicketsService
        this.logger.info('Priority change action triggered', { context: 'AutomationService' });
        break;
      case 'reassign_ticket':
        this.logger.info('Reassign action triggered', { context: 'AutomationService' });
        break;
      case 'change_status':
        this.logger.info('Status change action triggered', { context: 'AutomationService' });
        break;
      case 'escalate':
        this.logger.info('Escalation action triggered', { context: 'AutomationService' });
        break;
      case 'add_tag':
        this.logger.info('Add tag action triggered', { context: 'AutomationService' });
        break;
      case 'send_webhook':
        this.logger.info('Webhook action triggered', { context: 'AutomationService' });
        break;
      case 'add_comment':
        this.logger.info('Add comment action triggered', { context: 'AutomationService' });
        break;
      default:
        this.logger.warn(`Unknown automation action type: ${action.type}`, { context: 'AutomationService' });
    }
  }
}
