import { Ticket, TicketStatus, TicketPriority, TicketType } from '@/domain/entities/ticket.entity';
import { TicketComment, AttachmentInfo } from '@/domain/entities/notification.entity';
import { Category, TicketTemplate } from '@/domain/entities/category.entity';
import {
  TicketOrmEntity,
  TicketCommentOrmEntity,
  CategoryOrmEntity,
  TicketTemplateOrmEntity,
} from '../entities';

export class TicketMapper {
  static toDomain(orm: TicketOrmEntity): Ticket {
    return new Ticket({
      id: orm.id,
      title: orm.title,
      description: orm.description,
      status: orm.status as TicketStatus,
      priority: orm.priority as TicketPriority,
      type: orm.type as TicketType,
      categoryId: orm.categoryId,
      createdById: orm.createdById,
      assignedToId: orm.assignedToId,
      groupId: orm.groupId,
      slaConfigId: orm.slaConfigId,
      parentTicketId: orm.parentTicketId,
      tags: orm.tags || [],
      customFields: orm.customFields || {},
      resolvedAt: orm.resolvedAt,
      closedAt: orm.closedAt,
      firstResponseAt: orm.firstResponseAt,
      dueDate: orm.dueDate,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: Ticket): Partial<TicketOrmEntity> {
    return {
      id: domain.id,
      title: domain.title,
      description: domain.description,
      status: domain.status,
      priority: domain.priority,
      type: domain.type,
      categoryId: domain.categoryId,
      createdById: domain.createdById,
      assignedToId: domain.assignedToId,
      groupId: domain.groupId,
      slaConfigId: domain.slaConfigId,
      parentTicketId: domain.parentTicketId,
      tags: domain.tags,
      customFields: domain.customFields,
      resolvedAt: domain.resolvedAt,
      closedAt: domain.closedAt,
      firstResponseAt: domain.firstResponseAt,
      dueDate: domain.dueDate,
    };
  }
}

export class TicketCommentMapper {
  static toDomain(orm: TicketCommentOrmEntity): TicketComment {
    return new TicketComment({
      id: orm.id,
      ticketId: orm.ticketId,
      authorId: orm.authorId,
      content: orm.content,
      isInternal: orm.isInternal,
      attachments: orm.attachments as AttachmentInfo[],
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: TicketComment): Partial<TicketCommentOrmEntity> {
    return {
      id: domain.id,
      ticketId: domain.ticketId,
      authorId: domain.authorId,
      content: domain.content,
      isInternal: domain.isInternal,
      attachments: domain.attachments,
    };
  }
}

export class CategoryMapper {
  static toDomain(orm: CategoryOrmEntity): Category {
    return new Category({
      id: orm.id,
      name: orm.name,
      description: orm.description,
      parentId: orm.parentId,
      isActive: orm.isActive,
      sortOrder: orm.sortOrder,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: Category): Partial<CategoryOrmEntity> {
    return {
      id: domain.id,
      name: domain.name,
      description: domain.description,
      parentId: domain.parentId,
      isActive: domain.isActive,
      sortOrder: domain.sortOrder,
    };
  }
}

export class TicketTemplateMapper {
  static toDomain(orm: TicketTemplateOrmEntity): TicketTemplate {
    return new TicketTemplate({
      id: orm.id,
      name: orm.name,
      description: orm.description,
      categoryId: orm.categoryId,
      defaultPriority: orm.defaultPriority,
      defaultType: orm.defaultType,
      titleTemplate: orm.titleTemplate,
      descriptionTemplate: orm.descriptionTemplate,
      customFieldDefinitions: orm.customFieldDefinitions as any,
      isActive: orm.isActive,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: TicketTemplate): Partial<TicketTemplateOrmEntity> {
    return {
      id: domain.id,
      name: domain.name,
      description: domain.description,
      categoryId: domain.categoryId,
      defaultPriority: domain.defaultPriority,
      defaultType: domain.defaultType,
      titleTemplate: domain.titleTemplate,
      descriptionTemplate: domain.descriptionTemplate,
      customFieldDefinitions: domain.customFieldDefinitions,
      isActive: domain.isActive,
    };
  }
}
