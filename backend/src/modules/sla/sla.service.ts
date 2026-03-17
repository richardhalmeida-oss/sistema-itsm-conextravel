import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SlaConfig, SlaLog, SlaStatus } from '@/domain/entities/sla.entity';
import { ISlaConfigRepository, SLA_CONFIG_REPOSITORY } from '@/domain/repositories/sla.repository';
import { ISlaLogRepository, SLA_LOG_REPOSITORY } from '@/domain/repositories/sla.repository';
import { AuditService } from '@/modules/audit/audit.service';
import { AuditAction } from '@/domain/entities/audit-log.entity';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class SlaService {
  constructor(
    @Inject(SLA_CONFIG_REPOSITORY) private readonly configRepo: ISlaConfigRepository,
    @Inject(SLA_LOG_REPOSITORY) private readonly logRepo: ISlaLogRepository,
    private readonly auditService: AuditService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  // === SLA Config Management ===
  async findAllConfigs() {
    return this.configRepo.findAll();
  }

  async findConfigById(id: string) {
    const config = await this.configRepo.findById(id);
    if (!config) throw new NotFoundException(`SLA Config not found: ${id}`);
    return config;
  }

  async createConfig(data: {
    name: string;
    description: string;
    priority?: string;
    ticketType?: string;
    categoryId?: string;
    responseTimeMinutes: number;
    resolutionTimeMinutes: number;
    escalationRules?: any[];
    isDefault?: boolean;
  }, actorId: string, actorName: string): Promise<SlaConfig> {
    const config = new SlaConfig({
      name: data.name,
      description: data.description,
      priority: data.priority,
      ticketType: data.ticketType,
      categoryId: data.categoryId,
      responseTimeMinutes: data.responseTimeMinutes,
      resolutionTimeMinutes: data.resolutionTimeMinutes,
      escalationRules: data.escalationRules || [],
      isDefault: data.isDefault,
    });

    const saved = await this.configRepo.create(config);

    await this.auditService.log({
      userId: actorId,
      userName: actorName,
      action: AuditAction.CREATE,
      entity: 'sla_config',
      entityId: saved.id,
      after: { name: saved.name, responseTimeMinutes: saved.responseTimeMinutes, resolutionTimeMinutes: saved.resolutionTimeMinutes },
    });

    return saved;
  }

  async updateConfig(id: string, data: Partial<SlaConfig>, actorId: string, actorName: string) {
    const config = await this.findConfigById(id);
    const before = { name: config.name, responseTimeMinutes: config.responseTimeMinutes };

    Object.assign(config, data);
    config.markUpdated();
    const updated = await this.configRepo.update(config);

    await this.auditService.log({
      userId: actorId,
      userName: actorName,
      action: AuditAction.UPDATE,
      entity: 'sla_config',
      entityId: id,
      before,
      after: { name: updated.name, responseTimeMinutes: updated.responseTimeMinutes },
    });

    return updated;
  }

  // === SLA Log Management ===
  async initSlaForTicket(ticketId: string, priority: string, ticketType: string, categoryId: string | null): Promise<SlaLog | null> {
    const config = await this.configRepo.findMatchingConfig(priority, ticketType, categoryId);
    if (!config) {
      this.logger.warn(`No SLA config found for ticket ${ticketId}`, { context: 'SlaService' });
      return null;
    }

    const now = new Date();
    const responseDeadline = new Date(now.getTime() + config.responseTimeMinutes * 60 * 1000);
    const resolutionDeadline = new Date(now.getTime() + config.resolutionTimeMinutes * 60 * 1000);

    const slaLog = new SlaLog({
      ticketId,
      slaConfigId: config.id,
      responseDeadline,
      resolutionDeadline,
      startedAt: now,
    });

    const saved = await this.logRepo.create(slaLog);

    this.logger.info(`SLA initialized for ticket ${ticketId}: response by ${responseDeadline.toISOString()}, resolution by ${resolutionDeadline.toISOString()}`, {
      context: 'SlaService',
    });

    return saved;
  }

  async pauseSla(ticketId: string): Promise<void> {
    const slaLog = await this.logRepo.findByTicketId(ticketId);
    if (!slaLog) return;

    try {
      slaLog.pause();
      await this.logRepo.update(slaLog);

      await this.auditService.log({
        userId: null,
        userName: 'system',
        action: AuditAction.SLA_PAUSE,
        entity: 'sla_log',
        entityId: slaLog.id,
        metadata: { ticketId },
      });
    } catch (error) {
      this.logger.warn(`Cannot pause SLA for ticket ${ticketId}: ${error instanceof Error ? error.message : 'unknown'}`, {
        context: 'SlaService',
      });
    }
  }

  async resumeSla(ticketId: string): Promise<void> {
    const slaLog = await this.logRepo.findByTicketId(ticketId);
    if (!slaLog) return;

    try {
      slaLog.resume();
      await this.logRepo.update(slaLog);

      await this.auditService.log({
        userId: null,
        userName: 'system',
        action: AuditAction.SLA_RESUME,
        entity: 'sla_log',
        entityId: slaLog.id,
        metadata: { ticketId },
      });
    } catch (error) {
      this.logger.warn(`Cannot resume SLA for ticket ${ticketId}: ${error instanceof Error ? error.message : 'unknown'}`, {
        context: 'SlaService',
      });
    }
  }

  async recordResponse(ticketId: string): Promise<void> {
    const slaLog = await this.logRepo.findByTicketId(ticketId);
    if (!slaLog) return;
    slaLog.recordResponse();
    await this.logRepo.update(slaLog);
  }

  async recordResolution(ticketId: string): Promise<void> {
    const slaLog = await this.logRepo.findByTicketId(ticketId);
    if (!slaLog) return;
    slaLog.recordResolution();
    await this.logRepo.update(slaLog);

    if (slaLog.resolutionBreach) {
      await this.auditService.log({
        userId: null,
        userName: 'system',
        action: AuditAction.SLA_BREACH,
        entity: 'sla_log',
        entityId: slaLog.id,
        metadata: { ticketId, type: 'resolution' },
      });
    }
  }

  async getSlaForTicket(ticketId: string): Promise<SlaLog | null> {
    return this.logRepo.findByTicketId(ticketId);
  }

  // === Periodic SLA Check (runs every minute) ===
  @Cron(CronExpression.EVERY_MINUTE)
  async checkSlaBreaches(): Promise<void> {
    try {
      const runningSlas = await this.logRepo.findRunning();
      let breachCount = 0;

      for (const sla of runningSlas) {
        const breached = sla.checkBreach();
        if (breached) {
          await this.logRepo.update(sla);
          breachCount++;

          await this.auditService.log({
            userId: null,
            userName: 'system',
            action: AuditAction.SLA_BREACH,
            entity: 'sla_log',
            entityId: sla.id,
            metadata: {
              ticketId: sla.ticketId,
              responseBreach: sla.responseBreach,
              resolutionBreach: sla.resolutionBreach,
            },
          });

          this.logger.warn(`SLA breached for ticket ${sla.ticketId}`, {
            context: 'SlaService',
            slaId: sla.id,
          });
        }
      }

      if (breachCount > 0) {
        this.logger.info(`SLA check completed. ${breachCount} breach(es) detected.`, {
          context: 'SlaService',
        });
      }
    } catch (error) {
      this.logger.error('SLA breach check failed', {
        context: 'SlaService',
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  // === Analytics ===
  async getBreachedCount(dateFrom?: Date, dateTo?: Date): Promise<number> {
    return this.logRepo.countBreached({ dateFrom, dateTo });
  }

  async getAverageResolutionTime(dateFrom?: Date, dateTo?: Date): Promise<number> {
    return this.logRepo.getAverageResolutionTime({ dateFrom, dateTo });
  }
}
