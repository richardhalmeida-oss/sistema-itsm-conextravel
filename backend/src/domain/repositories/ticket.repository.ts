import { Ticket } from '../entities/ticket.entity';
import { TicketComment } from '../entities/notification.entity';
import { IBaseRepository, FindAllOptions, PaginatedResult } from './base.repository';

export const TICKET_REPOSITORY = Symbol('TICKET_REPOSITORY');
export const TICKET_COMMENT_REPOSITORY = Symbol('TICKET_COMMENT_REPOSITORY');

export interface TicketFindAllOptions extends FindAllOptions {
  status?: string;
  priority?: string;
  type?: string;
  categoryId?: string;
  assignedToId?: string;
  createdById?: string;
  groupId?: string;
  parentTicketId?: string | null;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ITicketRepository extends IBaseRepository<Ticket> {
  findAll(options?: TicketFindAllOptions): Promise<PaginatedResult<Ticket>>;
  findSubtasks(parentTicketId: string): Promise<Ticket[]>;
  findByAssignee(userId: string, options?: FindAllOptions): Promise<PaginatedResult<Ticket>>;
  findByCreator(userId: string, options?: FindAllOptions): Promise<PaginatedResult<Ticket>>;
  findByGroup(groupId: string, options?: FindAllOptions): Promise<PaginatedResult<Ticket>>;
  countByStatus(): Promise<Record<string, number>>;
  countByPriority(): Promise<Record<string, number>>;
  findOverdue(): Promise<Ticket[]>;
}

export interface ITicketCommentRepository extends IBaseRepository<TicketComment> {
  findByTicketId(ticketId: string): Promise<TicketComment[]>;
}
