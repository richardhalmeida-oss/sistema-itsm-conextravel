import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Ticket } from '@/domain/entities/ticket.entity';
import { TicketComment } from '@/domain/entities/notification.entity';
import { ITicketRepository, TicketFindAllOptions } from '@/domain/repositories/ticket.repository';
import { ITicketCommentRepository } from '@/domain/repositories/ticket.repository';
import { FindAllOptions, PaginatedResult } from '@/domain/repositories/base.repository';
import { TicketOrmEntity, TicketCommentOrmEntity } from '../entities';
import { TicketMapper, TicketCommentMapper } from '../mappers/ticket.mapper';

@Injectable()
export class TicketRepositoryImpl implements ITicketRepository {
  constructor(
    @InjectRepository(TicketOrmEntity)
    private readonly repo: Repository<TicketOrmEntity>,
  ) {}

  async findById(id: string): Promise<Ticket | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? TicketMapper.toDomain(entity) : null;
  }

  async findAll(options?: TicketFindAllOptions): Promise<PaginatedResult<Ticket>> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.repo.createQueryBuilder('ticket');

    // Apply specific filters
    if (options?.status) {
      qb.andWhere('ticket.status = :status', { status: options.status });
    }
    if (options?.priority) {
      qb.andWhere('ticket.priority = :priority', { priority: options.priority });
    }
    if (options?.type) {
      qb.andWhere('ticket.type = :type', { type: options.type });
    }
    if (options?.categoryId) {
      qb.andWhere('ticket.category_id = :categoryId', { categoryId: options.categoryId });
    }
    if (options?.assignedToId) {
      qb.andWhere('ticket.assigned_to_id = :assignedToId', { assignedToId: options.assignedToId });
    }
    if (options?.createdById) {
      qb.andWhere('ticket.created_by_id = :createdById', { createdById: options.createdById });
    }
    if (options?.groupId) {
      qb.andWhere('ticket.group_id = :groupId', { groupId: options.groupId });
    }
    if (options?.parentTicketId !== undefined) {
      if (options.parentTicketId === null) {
        qb.andWhere('ticket.parent_ticket_id IS NULL');
      } else {
        qb.andWhere('ticket.parent_ticket_id = :parentTicketId', {
          parentTicketId: options.parentTicketId,
        });
      }
    }
    if (options?.dateFrom) {
      qb.andWhere('ticket.created_at >= :dateFrom', { dateFrom: options.dateFrom });
    }
    if (options?.dateTo) {
      qb.andWhere('ticket.created_at <= :dateTo', { dateTo: options.dateTo });
    }

    // Apply search
    if (options?.search) {
      qb.andWhere(
        '(ticket.title ILIKE :search OR ticket.description ILIKE :search)',
        { search: `%${options.search}%` },
      );
    }

    // Apply sorting
    const sortBy = options?.sortBy || 'createdAt';
    const sortOrder = options?.sortOrder || 'DESC';
    qb.orderBy(`ticket.${sortBy}`, sortOrder);

    const [entities, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data: entities.map(TicketMapper.toDomain),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findSubtasks(parentTicketId: string): Promise<Ticket[]> {
    const entities = await this.repo.find({
      where: { parentTicketId },
      order: { createdAt: 'ASC' },
    });
    return entities.map(TicketMapper.toDomain);
  }

  async findByAssignee(userId: string, options?: FindAllOptions): Promise<PaginatedResult<Ticket>> {
    return this.findAll({ ...options, assignedToId: userId } as TicketFindAllOptions);
  }

  async findByCreator(userId: string, options?: FindAllOptions): Promise<PaginatedResult<Ticket>> {
    return this.findAll({ ...options, createdById: userId } as TicketFindAllOptions);
  }

  async findByGroup(groupId: string, options?: FindAllOptions): Promise<PaginatedResult<Ticket>> {
    return this.findAll({ ...options, groupId } as TicketFindAllOptions);
  }

  async countByStatus(): Promise<Record<string, number>> {
    const result = await this.repo
      .createQueryBuilder('ticket')
      .select('ticket.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('ticket.status')
      .getRawMany();

    return result.reduce(
      (acc, row) => {
        acc[row.status] = parseInt(row.count, 10);
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  async countByPriority(): Promise<Record<string, number>> {
    const result = await this.repo
      .createQueryBuilder('ticket')
      .select('ticket.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .groupBy('ticket.priority')
      .getRawMany();

    return result.reduce(
      (acc, row) => {
        acc[row.priority] = parseInt(row.count, 10);
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  async findOverdue(): Promise<Ticket[]> {
    const entities = await this.repo
      .createQueryBuilder('ticket')
      .where('ticket.due_date < :now', { now: new Date() })
      .andWhere('ticket.status NOT IN (:...statuses)', {
        statuses: ['closed', 'cancelled', 'resolved'],
      })
      .getMany();
    return entities.map(TicketMapper.toDomain);
  }

  async create(ticket: Ticket): Promise<Ticket> {
    const ormData = TicketMapper.toOrm(ticket);
    const entity = this.repo.create(ormData);
    const saved = await this.repo.save(entity);
    return TicketMapper.toDomain(saved);
  }

  async update(ticket: Ticket): Promise<Ticket> {
    const ormData = TicketMapper.toOrm(ticket);
    const existing = await this.repo.findOneOrFail({ where: { id: ticket.id } });
    Object.assign(existing, ormData);
    const saved = await this.repo.save(existing);
    return TicketMapper.toDomain(saved);
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
export class TicketCommentRepositoryImpl implements ITicketCommentRepository {
  constructor(
    @InjectRepository(TicketCommentOrmEntity)
    private readonly repo: Repository<TicketCommentOrmEntity>,
  ) {}

  async findById(id: string): Promise<TicketComment | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? TicketCommentMapper.toDomain(entity) : null;
  }

  async findByTicketId(ticketId: string): Promise<TicketComment[]> {
    const entities = await this.repo.find({
      where: { ticketId },
      order: { createdAt: 'ASC' },
    });
    return entities.map(TicketCommentMapper.toDomain);
  }

  async findAll(options?: FindAllOptions): Promise<PaginatedResult<TicketComment>> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const [entities, total] = await this.repo.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: entities.map(TicketCommentMapper.toDomain),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(comment: TicketComment): Promise<TicketComment> {
    const ormData = TicketCommentMapper.toOrm(comment);
    const entity = this.repo.create(ormData);
    const saved = await this.repo.save(entity);
    return TicketCommentMapper.toDomain(saved);
  }

  async update(comment: TicketComment): Promise<TicketComment> {
    const ormData = TicketCommentMapper.toOrm(comment);
    await this.repo.update(comment.id, ormData);
    const updated = await this.repo.findOneOrFail({ where: { id: comment.id } });
    return TicketCommentMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repo.count({ where: { id } });
    return count > 0;
  }
}
