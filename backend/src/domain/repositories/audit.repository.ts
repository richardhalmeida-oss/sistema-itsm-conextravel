import { AuditLog, AuditAction } from '../entities/audit-log.entity';
import { IBaseRepository, FindAllOptions, PaginatedResult } from './base.repository';

export const AUDIT_LOG_REPOSITORY = Symbol('AUDIT_LOG_REPOSITORY');

export interface AuditFindAllOptions extends FindAllOptions {
  userId?: string;
  action?: AuditAction;
  entity?: string;
  entityId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface IAuditLogRepository extends Omit<IBaseRepository<AuditLog>, 'update' | 'delete'> {
  findAll(options?: AuditFindAllOptions): Promise<PaginatedResult<AuditLog>>;
  findByEntity(entity: string, entityId: string): Promise<AuditLog[]>;
  findByUser(userId: string, options?: FindAllOptions): Promise<PaginatedResult<AuditLog>>;
  create(log: AuditLog): Promise<AuditLog>;
}
