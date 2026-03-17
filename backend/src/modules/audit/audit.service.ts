import { Injectable, Inject } from '@nestjs/common';
import { AuditLog, AuditAction } from '@/domain/entities/audit-log.entity';
import { IAuditLogRepository, AUDIT_LOG_REPOSITORY } from '@/domain/repositories/audit.repository';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

export interface CreateAuditLogInput {
  userId?: string | null;
  userName: string;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditService {
  constructor(
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: IAuditLogRepository,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
  ) {}

  async log(input: CreateAuditLogInput): Promise<AuditLog> {
    try {
      const auditLog = new AuditLog({
        userId: input.userId || null,
        userName: input.userName,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        before: input.before,
        after: input.after,
        metadata: input.metadata || {},
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      });

      const saved = await this.auditLogRepository.create(auditLog);

      this.logger.info(`Audit: ${saved.getDescription()}`, {
        context: 'AuditService',
        auditId: saved.id,
        action: saved.action,
        entity: saved.entity,
        entityId: saved.entityId,
      });

      return saved;
    } catch (error) {
      // Audit logging must never break the main flow
      this.logger.error('Failed to create audit log', {
        context: 'AuditService',
        error: error instanceof Error ? error.message : 'Unknown error',
        input,
      });
      // Return a mock audit log to prevent downstream errors
      return new AuditLog({
        userId: input.userId || null,
        userName: input.userName,
        action: input.action,
        entity: input.entity,
      });
    }
  }

  async findAll(options?: import('@/domain/repositories/audit.repository').AuditFindAllOptions) {
    return this.auditLogRepository.findAll(options);
  }

  async findByEntity(entity: string, entityId: string) {
    return this.auditLogRepository.findByEntity(entity, entityId);
  }

  async findByUser(userId: string, options?: import('@/domain/repositories/base.repository').FindAllOptions) {
    return this.auditLogRepository.findByUser(userId, options);
  }
}
