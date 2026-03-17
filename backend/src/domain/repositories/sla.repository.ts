import { SlaConfig, SlaLog } from '../entities/sla.entity';
import { IBaseRepository } from './base.repository';

export const SLA_CONFIG_REPOSITORY = Symbol('SLA_CONFIG_REPOSITORY');
export const SLA_LOG_REPOSITORY = Symbol('SLA_LOG_REPOSITORY');

export interface ISlaConfigRepository extends IBaseRepository<SlaConfig> {
  findMatchingConfig(
    priority: string,
    ticketType: string,
    categoryId: string | null,
  ): Promise<SlaConfig | null>;
  findDefault(): Promise<SlaConfig | null>;
}

export interface ISlaLogRepository extends IBaseRepository<SlaLog> {
  findByTicketId(ticketId: string): Promise<SlaLog | null>;
  findRunning(): Promise<SlaLog[]>;
  findBreached(options?: { dateFrom?: Date; dateTo?: Date }): Promise<SlaLog[]>;
  countBreached(options?: { dateFrom?: Date; dateTo?: Date }): Promise<number>;
  getAverageResolutionTime(options?: { dateFrom?: Date; dateTo?: Date }): Promise<number>;
}
