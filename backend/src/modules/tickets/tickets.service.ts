import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Ticket, TicketStatus, TicketPriority, TicketType } from '@/domain/entities/ticket.entity';
import { TicketComment } from '@/domain/entities/notification.entity';
import { ITicketRepository, TICKET_REPOSITORY, TicketFindAllOptions } from '@/domain/repositories/ticket.repository';
import { ITicketCommentRepository, TICKET_COMMENT_REPOSITORY } from '@/domain/repositories/ticket.repository';
import { AuditService } from '@/modules/audit/audit.service';
import { AuditAction } from '@/domain/entities/audit-log.entity';
import { FindAllOptions, PaginatedResult } from '@/domain/repositories/base.repository';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { NotificationType } from '@/domain/entities/notification.entity';

@Injectable()
export class TicketsService {
  constructor(
    @Inject(TICKET_REPOSITORY) private readonly ticketRepo: ITicketRepository,
    @Inject(TICKET_COMMENT_REPOSITORY) private readonly commentRepo: ITicketCommentRepository,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(options?: TicketFindAllOptions): Promise<PaginatedResult<Ticket>> {
    return this.ticketRepo.findAll(options);
  }

  async findById(id: string): Promise<Ticket> {
    const ticket = await this.ticketRepo.findById(id);
    if (!ticket) throw new NotFoundException(`Ticket not found: ${id}`);
    return ticket;
  }

  async create(
    data: {
      title: string;
      description: string;
      priority: TicketPriority;
      type?: TicketType;
      categoryId?: string;
      assignedToId?: string;
      groupId?: string;
      parentTicketId?: string;
      tags?: string[];
      customFields?: Record<string, unknown>;
      dueDate?: Date;
    },
    createdById: string,
    actorName: string,
  ): Promise<Ticket> {
    // Validate parent ticket exists if it's a subtask
    if (data.parentTicketId) {
      const parent = await this.ticketRepo.findById(data.parentTicketId);
      if (!parent) {
        throw new BadRequestException('Parent ticket not found');
      }
      if (parent.isSubtask()) {
        throw new BadRequestException('Cannot create a subtask of a subtask');
      }
    }

    const ticket = new Ticket({
      title: data.title,
      description: data.description,
      priority: data.priority,
      type: data.type,
      categoryId: data.categoryId || null,
      createdById,
      assignedToId: data.assignedToId || null,
      groupId: data.groupId || null,
      parentTicketId: data.parentTicketId || null,
      tags: data.tags || [],
      customFields: data.customFields || {},
      dueDate: data.dueDate || null,
    });

    // Auto-transition to in_progress if assigned
    if (data.assignedToId) {
      ticket.assignTo(data.assignedToId);
    }

    const saved = await this.ticketRepo.create(ticket);

    // Notification for assignee
    if (saved.assignedToId) {
      await this.notificationsService.send({
        type: NotificationType.SYSTEM,
        recipientId: saved.assignedToId,
        title: 'Novo chamado atribuído',
        content: `O chamado #${saved.title} foi atribuído a você.`,
        metadata: { ticketId: saved.id },
      });
    }

    await this.auditService.log({
      userId: createdById,
      userName: actorName,
      action: AuditAction.CREATE,
      entity: 'ticket',
      entityId: saved.id,
      after: {
        title: saved.title,
        status: saved.status,
        priority: saved.priority,
        assignedToId: saved.assignedToId,
      },
    });

    return saved;
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      priority?: TicketPriority;
      categoryId?: string;
      assignedToId?: string;
      groupId?: string;
      tags?: string[];
      customFields?: Record<string, unknown>;
      dueDate?: Date;
    },
    actorId: string,
    actorName: string,
  ): Promise<Ticket> {
    const ticket = await this.findById(id);
    const before = {
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      assignedToId: ticket.assignedToId,
    };

    if (ticket.isTerminal()) {
      throw new BadRequestException('Cannot update a closed or cancelled ticket');
    }

    if (data.title) ticket.title = data.title;
    if (data.description) ticket.description = data.description;
    if (data.priority) ticket.priority = data.priority;
    if (data.categoryId !== undefined) ticket.categoryId = data.categoryId;
    if (data.assignedToId !== undefined) {
      if (data.assignedToId) {
        ticket.assignTo(data.assignedToId);
      } else {
        ticket.assignedToId = null;
      }
    }
    if (data.groupId !== undefined) ticket.groupId = data.groupId;
    if (data.tags) ticket.tags = data.tags;
    if (data.customFields) ticket.customFields = { ...ticket.customFields, ...data.customFields };
    if (data.dueDate) ticket.dueDate = data.dueDate;

    ticket.markUpdated();
    const updated = await this.ticketRepo.update(ticket);

    await this.auditService.log({
      userId: actorId,
      userName: actorName,
      action: AuditAction.UPDATE,
      entity: 'ticket',
      entityId: id,
      before,
      after: {
        title: updated.title,
        description: updated.description,
        priority: updated.priority,
        assignedToId: updated.assignedToId,
      },
    });

    return updated;
  }

  async changeStatus(
    id: string,
    newStatus: TicketStatus,
    actorId: string,
    actorName: string,
  ): Promise<Ticket> {
    const ticket = await this.findById(id);
    const oldStatus = ticket.status;

    ticket.transitionTo(newStatus); // Validates the transition

    const updated = await this.ticketRepo.update(ticket);

    // Notification for creator
    await this.notificationsService.send({
      type: NotificationType.SYSTEM,
      recipientId: updated.createdById,
      title: 'Status do chamado alterado',
      content: `O status do seu chamado #${updated.title} mudou para ${updated.status}.`,
      metadata: { ticketId: updated.id, newStatus: updated.status },
    });

    await this.auditService.log({
      userId: actorId,
      userName: actorName,
      action: AuditAction.STATUS_CHANGE,
      entity: 'ticket',
      entityId: id,
      before: { status: oldStatus },
      after: { status: newStatus },
    });

    return updated;
  }

  async assignTicket(
    id: string,
    assignedToId: string,
    actorId: string,
    actorName: string,
  ): Promise<Ticket> {
    const ticket = await this.findById(id);
    const oldAssignee = ticket.assignedToId;

    ticket.assignTo(assignedToId);
    const updated = await this.ticketRepo.update(ticket);

    // Notification for new assignee
    await this.notificationsService.send({
      type: NotificationType.SYSTEM,
      recipientId: assignedToId,
      title: 'Novo chamado atribuído',
      content: `O chamado #${updated.title} foi atribuído a você.`,
      metadata: { ticketId: updated.id },
    });

    await this.auditService.log({
      userId: actorId,
      userName: actorName,
      action: AuditAction.ASSIGNMENT,
      entity: 'ticket',
      entityId: id,
      before: { assignedToId: oldAssignee },
      after: { assignedToId },
    });

    return updated;
  }

  async addComment(
    ticketId: string,
    data: { content: string; isInternal?: boolean },
    authorId: string,
    actorName: string,
  ): Promise<TicketComment> {
    const ticket = await this.findById(ticketId);

    // Record first response if assigned user is commenting
    if (ticket.assignedToId === authorId) {
      ticket.markFirstResponse();
      await this.ticketRepo.update(ticket);
    }

    const comment = new TicketComment({
      ticketId,
      authorId,
      content: data.content,
      isInternal: data.isInternal || false,
    });

    const saved = await this.commentRepo.create(comment);

    // Notification for creator if technician replied, or for technician if creator replied
    const recipientId = authorId === ticket.createdById ? ticket.assignedToId : ticket.createdById;
    if (recipientId) {
      await this.notificationsService.send({
        type: NotificationType.SYSTEM,
        recipientId,
        title: 'Novo comentário no chamado',
        content: `Há um novo comentário no chamado #${ticket.title}.`,
        metadata: { ticketId: ticket.id, isInternal: data.isInternal },
      });
    }

    await this.auditService.log({
      userId: authorId,
      userName: actorName,
      action: AuditAction.CREATE,
      entity: 'ticket_comment',
      entityId: saved.id,
      metadata: { ticketId, isInternal: data.isInternal },
    });

    return saved;
  }

  async getComments(ticketId: string): Promise<TicketComment[]> {
    await this.findById(ticketId); // Ensure ticket exists
    return this.commentRepo.findByTicketId(ticketId);
  }

  async getSubtasks(ticketId: string): Promise<Ticket[]> {
    await this.findById(ticketId);
    return this.ticketRepo.findSubtasks(ticketId);
  }

  async getMyTickets(userId: string, options?: FindAllOptions) {
    return this.ticketRepo.findByAssignee(userId, options);
  }

  async getCreatedByMe(userId: string, options?: FindAllOptions) {
    return this.ticketRepo.findByCreator(userId, options);
  }

  async countByStatus() {
    return this.ticketRepo.countByStatus();
  }

  async countByPriority() {
    return this.ticketRepo.countByPriority();
  }

  async delete(id: string, actorId: string, actorName: string) {
    const ticket = await this.findById(id);
    await this.ticketRepo.delete(id);

    await this.auditService.log({
      userId: actorId,
      userName: actorName,
      action: AuditAction.DELETE,
      entity: 'ticket',
      entityId: id,
      before: { title: ticket.title, status: ticket.status },
    });
  }
}
