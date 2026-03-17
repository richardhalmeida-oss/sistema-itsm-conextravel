import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AutomationRule, AutomationTrigger } from '@/domain/entities/automation.entity';
import { Notification, NotificationStatus } from '@/domain/entities/notification.entity';
import { Category, TicketTemplate } from '@/domain/entities/category.entity';
import { IAutomationRepository } from '@/domain/repositories/automation.repository';
import { INotificationRepository } from '@/domain/repositories/notification.repository';
import { ICategoryRepository, ITicketTemplateRepository } from '@/domain/repositories/category.repository';
import { FindAllOptions, PaginatedResult } from '@/domain/repositories/base.repository';
import {
  AutomationRuleOrmEntity,
  NotificationOrmEntity,
  CategoryOrmEntity,
  TicketTemplateOrmEntity,
} from '../entities';
import {
  AutomationRuleMapper,
  NotificationMapper,
} from '../mappers/other.mapper';
import { CategoryMapper, TicketTemplateMapper } from '../mappers/ticket.mapper';

@Injectable()
export class AutomationRepositoryImpl implements IAutomationRepository {
  constructor(
    @InjectRepository(AutomationRuleOrmEntity)
    private readonly repo: Repository<AutomationRuleOrmEntity>,
  ) {}

  async findById(id: string): Promise<AutomationRule | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? AutomationRuleMapper.toDomain(entity) : null;
  }

  async findByTrigger(trigger: AutomationTrigger): Promise<AutomationRule[]> {
    const entities = await this.repo.find({
      where: { trigger, isActive: true },
      order: { priority: 'ASC' },
    });
    return entities.map(AutomationRuleMapper.toDomain);
  }

  async findActive(): Promise<AutomationRule[]> {
    const entities = await this.repo.find({
      where: { isActive: true },
      order: { priority: 'ASC' },
    });
    return entities.map(AutomationRuleMapper.toDomain);
  }

  async findAll(options?: FindAllOptions): Promise<PaginatedResult<AutomationRule>> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const [entities, total] = await this.repo.findAndCount({
      skip,
      take: limit,
      order: { priority: 'ASC' },
    });

    return {
      data: entities.map(AutomationRuleMapper.toDomain),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(rule: AutomationRule): Promise<AutomationRule> {
    const ormData = AutomationRuleMapper.toOrm(rule);
    const entity = this.repo.create(ormData);
    const saved = await this.repo.save(entity);
    return AutomationRuleMapper.toDomain(saved);
  }

  async update(rule: AutomationRule): Promise<AutomationRule> {
    const ormData = AutomationRuleMapper.toOrm(rule);
    const existing = await this.repo.findOneOrFail({ where: { id: rule.id } });
    Object.assign(existing, ormData);
    const saved = await this.repo.save(existing);
    return AutomationRuleMapper.toDomain(saved);
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
export class NotificationRepositoryImpl implements INotificationRepository {
  constructor(
    @InjectRepository(NotificationOrmEntity)
    private readonly repo: Repository<NotificationOrmEntity>,
  ) {}

  async findById(id: string): Promise<Notification | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? NotificationMapper.toDomain(entity) : null;
  }

  async findByRecipient(userId: string, options?: FindAllOptions): Promise<PaginatedResult<Notification>> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const [entities, total] = await this.repo.findAndCount({
      where: { recipientId: userId },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: entities.map(NotificationMapper.toDomain),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findPending(): Promise<Notification[]> {
    const entities = await this.repo.find({
      where: { status: 'pending' },
      order: { createdAt: 'ASC' },
    });
    return entities.map(NotificationMapper.toDomain);
  }

  async findFailed(): Promise<Notification[]> {
    const entities = await this.repo.find({
      where: { status: 'failed' },
      order: { createdAt: 'ASC' },
    });
    return entities.map(NotificationMapper.toDomain);
  }

  async countUnread(userId: string): Promise<number> {
    return this.repo.count({
      where: {
        recipientId: userId,
        status: 'sent' as any,
      },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update()
      .set({ status: 'read', readAt: new Date() })
      .where('recipient_id = :userId AND status = :status', {
        userId,
        status: 'sent',
      })
      .execute();
  }

  async findAll(options?: FindAllOptions): Promise<PaginatedResult<Notification>> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const [entities, total] = await this.repo.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: entities.map(NotificationMapper.toDomain),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(notification: Notification): Promise<Notification> {
    const ormData = NotificationMapper.toOrm(notification);
    const entity = this.repo.create(ormData);
    const saved = await this.repo.save(entity);
    return NotificationMapper.toDomain(saved);
  }

  async update(notification: Notification): Promise<Notification> {
    const ormData = NotificationMapper.toOrm(notification);
    const existing = await this.repo.findOneOrFail({ where: { id: notification.id } });
    Object.assign(existing, ormData);
    const saved = await this.repo.save(existing);
    return NotificationMapper.toDomain(saved);
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
export class CategoryRepositoryImpl implements ICategoryRepository {
  constructor(
    @InjectRepository(CategoryOrmEntity)
    private readonly repo: Repository<CategoryOrmEntity>,
  ) {}

  async findById(id: string): Promise<Category | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? CategoryMapper.toDomain(entity) : null;
  }

  async findByName(name: string): Promise<Category | null> {
    const entity = await this.repo.findOne({ where: { name } });
    return entity ? CategoryMapper.toDomain(entity) : null;
  }

  async findRootCategories(): Promise<Category[]> {
    const entities = await this.repo.find({
      where: { parentId: undefined },
      order: { sortOrder: 'ASC' },
    });
    return entities.map(CategoryMapper.toDomain);
  }

  async findSubcategories(parentId: string): Promise<Category[]> {
    const entities = await this.repo.find({
      where: { parentId },
      order: { sortOrder: 'ASC' },
    });
    return entities.map(CategoryMapper.toDomain);
  }

  async findActive(): Promise<Category[]> {
    const entities = await this.repo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
    return entities.map(CategoryMapper.toDomain);
  }

  async findAll(options?: FindAllOptions): Promise<PaginatedResult<Category>> {
    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const skip = (page - 1) * limit;

    const [entities, total] = await this.repo.findAndCount({
      skip,
      take: limit,
      order: { sortOrder: 'ASC' },
    });

    return {
      data: entities.map(CategoryMapper.toDomain),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(category: Category): Promise<Category> {
    const ormData = CategoryMapper.toOrm(category);
    const entity = this.repo.create(ormData);
    const saved = await this.repo.save(entity);
    return CategoryMapper.toDomain(saved);
  }

  async update(category: Category): Promise<Category> {
    const ormData = CategoryMapper.toOrm(category);
    await this.repo.update(category.id, ormData);
    const updated = await this.repo.findOneOrFail({ where: { id: category.id } });
    return CategoryMapper.toDomain(updated);
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
export class TicketTemplateRepositoryImpl implements ITicketTemplateRepository {
  constructor(
    @InjectRepository(TicketTemplateOrmEntity)
    private readonly repo: Repository<TicketTemplateOrmEntity>,
  ) {}

  async findById(id: string): Promise<TicketTemplate | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? TicketTemplateMapper.toDomain(entity) : null;
  }

  async findByCategory(categoryId: string): Promise<TicketTemplate[]> {
    const entities = await this.repo.find({
      where: { categoryId, isActive: true },
    });
    return entities.map(TicketTemplateMapper.toDomain);
  }

  async findActive(): Promise<TicketTemplate[]> {
    const entities = await this.repo.find({
      where: { isActive: true },
    });
    return entities.map(TicketTemplateMapper.toDomain);
  }

  async findAll(options?: FindAllOptions): Promise<PaginatedResult<TicketTemplate>> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const [entities, total] = await this.repo.findAndCount({
      skip,
      take: limit,
      order: { name: 'ASC' },
    });

    return {
      data: entities.map(TicketTemplateMapper.toDomain),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(template: TicketTemplate): Promise<TicketTemplate> {
    const ormData = TicketTemplateMapper.toOrm(template);
    const entity = this.repo.create(ormData);
    const saved = await this.repo.save(entity);
    return TicketTemplateMapper.toDomain(saved);
  }

  async update(template: TicketTemplate): Promise<TicketTemplate> {
    const ormData = TicketTemplateMapper.toOrm(template);
    const existing = await this.repo.findOneOrFail({ where: { id: template.id } });
    Object.assign(existing, ormData);
    const saved = await this.repo.save(existing);
    return TicketTemplateMapper.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repo.count({ where: { id } });
    return count > 0;
  }
}
