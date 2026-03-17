import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AuditLog } from '@/domain/entities/audit-log.entity';
import { IAuditLogRepository, AuditFindAllOptions } from '@/domain/repositories/audit.repository';
import { FindAllOptions, PaginatedResult } from '@/domain/repositories/base.repository';
import { AuditLogOrmEntity } from '../entities';
import { AuditLogMapper } from '../mappers/other.mapper';

@Injectable()
export class AuditLogRepositoryImpl implements IAuditLogRepository {
  constructor(
    @InjectRepository(AuditLogOrmEntity)
    private readonly repo: Repository<AuditLogOrmEntity>,
  ) {}

  async findById(id: string): Promise<AuditLog | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? AuditLogMapper.toDomain(entity) : null;
  }

  async findAll(options?: AuditFindAllOptions): Promise<PaginatedResult<AuditLog>> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.repo.createQueryBuilder('audit');

    if (options?.userId) {
      qb.andWhere('audit.user_id = :userId', { userId: options.userId });
    }
    if (options?.action) {
      qb.andWhere('audit.action = :action', { action: options.action });
    }
    if (options?.entity) {
      qb.andWhere('audit.entity = :entity', { entity: options.entity });
    }
    if (options?.entityId) {
      qb.andWhere('audit.entity_id = :entityId', { entityId: options.entityId });
    }
    if (options?.dateFrom) {
      qb.andWhere('audit.created_at >= :dateFrom', { dateFrom: options.dateFrom });
    }
    if (options?.dateTo) {
      qb.andWhere('audit.created_at <= :dateTo', { dateTo: options.dateTo });
    }
    if (options?.search) {
      qb.andWhere('audit.user_name ILIKE :search', { search: `%${options.search}%` });
    }

    qb.orderBy('audit.created_at', 'DESC');

    const [entities, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data: entities.map(AuditLogMapper.toDomain),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByEntity(entity: string, entityId: string): Promise<AuditLog[]> {
    const entities = await this.repo.find({
      where: { entity, entityId },
      order: { createdAt: 'DESC' },
    });
    return entities.map(AuditLogMapper.toDomain);
  }

  async findByUser(userId: string, options?: FindAllOptions): Promise<PaginatedResult<AuditLog>> {
    return this.findAll({ ...options, userId } as AuditFindAllOptions);
  }

  async create(log: AuditLog): Promise<AuditLog> {
    const ormData = AuditLogMapper.toOrm(log);
    const entity = this.repo.create(ormData);
    const saved = await this.repo.save(entity);
    return AuditLogMapper.toDomain(saved);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repo.count({ where: { id } });
    return count > 0;
  }
}
