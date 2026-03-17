import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull, LessThan } from 'typeorm';
import { SlaConfig, SlaLog } from '@/domain/entities/sla.entity';
import { ISlaConfigRepository, ISlaLogRepository } from '@/domain/repositories/sla.repository';
import { FindAllOptions, PaginatedResult } from '@/domain/repositories/base.repository';
import { SlaConfigOrmEntity, SlaLogOrmEntity } from '../entities';
import { SlaConfigMapper, SlaLogMapper } from '../mappers/other.mapper';

@Injectable()
export class SlaConfigRepositoryImpl implements ISlaConfigRepository {
  constructor(
    @InjectRepository(SlaConfigOrmEntity)
    private readonly repo: Repository<SlaConfigOrmEntity>,
  ) {}

  async findById(id: string): Promise<SlaConfig | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? SlaConfigMapper.toDomain(entity) : null;
  }

  async findMatchingConfig(
    priority: string,
    ticketType: string,
    categoryId: string | null,
  ): Promise<SlaConfig | null> {
    // Try to find the most specific matching config
    // Priority: exact match > partial match > default
    const configs = await this.repo.find({
      where: { isActive: true },
      order: { priority: 'ASC' },
    });

    const domainConfigs = configs.map(SlaConfigMapper.toDomain);

    // First try exact match
    let match = domainConfigs.find(
      (c) => c.matchesTicket(priority, ticketType, categoryId) && !c.isDefault,
    );

    // Then try default
    if (!match) {
      match = domainConfigs.find((c) => c.isDefault);
    }

    return match || null;
  }

  async findDefault(): Promise<SlaConfig | null> {
    const entity = await this.repo.findOne({
      where: { isDefault: true, isActive: true },
    });
    return entity ? SlaConfigMapper.toDomain(entity) : null;
  }

  async findAll(options?: FindAllOptions): Promise<PaginatedResult<SlaConfig>> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const [entities, total] = await this.repo.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: entities.map(SlaConfigMapper.toDomain),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(config: SlaConfig): Promise<SlaConfig> {
    const ormData = SlaConfigMapper.toOrm(config);
    const entity = this.repo.create(ormData);
    const saved = await this.repo.save(entity);
    return SlaConfigMapper.toDomain(saved);
  }

  async update(config: SlaConfig): Promise<SlaConfig> {
    const ormData = SlaConfigMapper.toOrm(config);
    await this.repo.update(config.id, ormData);
    const updated = await this.repo.findOneOrFail({ where: { id: config.id } });
    return SlaConfigMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repo.count({ where: { id } });
    return count > 0;
  }
}

@Injectable()
export class SlaLogRepositoryImpl implements ISlaLogRepository {
  constructor(
    @InjectRepository(SlaLogOrmEntity)
    private readonly repo: Repository<SlaLogOrmEntity>,
  ) {}

  async findById(id: string): Promise<SlaLog | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? SlaLogMapper.toDomain(entity) : null;
  }

  async findByTicketId(ticketId: string): Promise<SlaLog | null> {
    const entity = await this.repo.findOne({ where: { ticketId } });
    return entity ? SlaLogMapper.toDomain(entity) : null;
  }

  async findRunning(): Promise<SlaLog[]> {
    const entities = await this.repo.find({ where: { status: 'running' } });
    return entities.map(SlaLogMapper.toDomain);
  }

  async findBreached(options?: { dateFrom?: Date; dateTo?: Date }): Promise<SlaLog[]> {
    const qb = this.repo
      .createQueryBuilder('sla')
      .where('(sla.response_breach = true OR sla.resolution_breach = true)');

    if (options?.dateFrom) {
      qb.andWhere('sla.created_at >= :dateFrom', { dateFrom: options.dateFrom });
    }
    if (options?.dateTo) {
      qb.andWhere('sla.created_at <= :dateTo', { dateTo: options.dateTo });
    }

    const entities = await qb.getMany();
    return entities.map(SlaLogMapper.toDomain);
  }

  async countBreached(options?: { dateFrom?: Date; dateTo?: Date }): Promise<number> {
    const qb = this.repo
      .createQueryBuilder('sla')
      .where('(sla.response_breach = true OR sla.resolution_breach = true)');

    if (options?.dateFrom) {
      qb.andWhere('sla.created_at >= :dateFrom', { dateFrom: options.dateFrom });
    }
    if (options?.dateTo) {
      qb.andWhere('sla.created_at <= :dateTo', { dateTo: options.dateTo });
    }

    return qb.getCount();
  }

  async getAverageResolutionTime(options?: { dateFrom?: Date; dateTo?: Date }): Promise<number> {
    const qb = this.repo
      .createQueryBuilder('sla')
      .select('AVG(EXTRACT(EPOCH FROM (sla.resolved_at - sla.started_at)) / 60)', 'avgMinutes')
      .where('sla.resolved_at IS NOT NULL');

    if (options?.dateFrom) {
      qb.andWhere('sla.created_at >= :dateFrom', { dateFrom: options.dateFrom });
    }
    if (options?.dateTo) {
      qb.andWhere('sla.created_at <= :dateTo', { dateTo: options.dateTo });
    }

    const result = await qb.getRawOne();
    return result?.avgMinutes ? parseFloat(result.avgMinutes) : 0;
  }

  async findAll(options?: FindAllOptions): Promise<PaginatedResult<SlaLog>> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const [entities, total] = await this.repo.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: entities.map(SlaLogMapper.toDomain),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(log: SlaLog): Promise<SlaLog> {
    const ormData = SlaLogMapper.toOrm(log);
    const entity = this.repo.create(ormData);
    const saved = await this.repo.save(entity);
    return SlaLogMapper.toDomain(saved);
  }

  async update(log: SlaLog): Promise<SlaLog> {
    const ormData = SlaLogMapper.toOrm(log);
    await this.repo.update(log.id, ormData);
    const updated = await this.repo.findOneOrFail({ where: { id: log.id } });
    return SlaLogMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repo.count({ where: { id } });
    return count > 0;
  }
}
