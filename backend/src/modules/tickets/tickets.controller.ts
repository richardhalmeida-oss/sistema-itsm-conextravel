import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { RequirePermissions, PermissionsGuard } from '@/modules/auth/guards/permissions.guard';
import { TicketPriority, TicketType, TicketStatus } from '@/domain/entities/ticket.entity';

@ApiTags('Tickets')
@Controller('tickets')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @ApiOperation({ summary: 'List all tickets with filters' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'assignedToId', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
    @Query('assignedToId') assignedToId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    return this.ticketsService.findAll({
      page, limit, status, priority, search,
      assignedToId, categoryId, sortBy, sortOrder,
    });
  }

  @Get('my')
  @ApiOperation({ summary: 'My assigned tickets' })
  async myTickets(
    @Request() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ticketsService.getMyTickets(req.user.id, { page, limit });
  }

  @Get('created-by-me')
  @ApiOperation({ summary: 'Tickets I created' })
  async createdByMe(
    @Request() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ticketsService.getCreatedByMe(req.user.id, { page, limit });
  }

  @Get('stats/by-status')
  @ApiOperation({ summary: 'Ticket count by status' })
  async countByStatus() {
    return this.ticketsService.countByStatus();
  }

  @Get('stats/by-priority')
  @ApiOperation({ summary: 'Ticket count by priority' })
  async countByPriority() {
    return this.ticketsService.countByPriority();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  async findById(@Param('id') id: string) {
    return this.ticketsService.findById(id);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get ticket comments' })
  async getComments(@Param('id') id: string) {
    return this.ticketsService.getComments(id);
  }

  @Get(':id/subtasks')
  @ApiOperation({ summary: 'Get subtasks of a ticket' })
  async getSubtasks(@Param('id') id: string) {
    return this.ticketsService.getSubtasks(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create ticket' })
  async create(
    @Body() body: {
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
      dueDate?: string;
    },
    @Request() req: any,
  ) {
    return this.ticketsService.create(
      {
        ...body,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      },
      req.user.id,
      req.user.name,
    );
  }

  @Put(':id')
  @RequirePermissions('tickets:update')
  @ApiOperation({ summary: 'Update ticket' })
  async update(
    @Param('id') id: string,
    @Body() body: {
      title?: string;
      description?: string;
      priority?: TicketPriority;
      categoryId?: string;
      assignedToId?: string;
      groupId?: string;
      tags?: string[];
      customFields?: Record<string, unknown>;
      dueDate?: string;
    },
    @Request() req: any,
  ) {
    return this.ticketsService.update(
      id,
      {
        ...body,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      },
      req.user.id,
      req.user.name,
    );
  }

  @Patch(':id/status')
  @RequirePermissions('tickets:update')
  @ApiOperation({ summary: 'Change ticket status' })
  async changeStatus(
    @Param('id') id: string,
    @Body() body: { status: TicketStatus },
    @Request() req: any,
  ) {
    return this.ticketsService.changeStatus(id, body.status, req.user.id, req.user.name);
  }

  @Patch(':id/assign')
  @RequirePermissions('tickets:update')
  @ApiOperation({ summary: 'Assign ticket' })
  async assign(
    @Param('id') id: string,
    @Body() body: { assignedToId: string },
    @Request() req: any,
  ) {
    return this.ticketsService.assignTicket(id, body.assignedToId, req.user.id, req.user.name);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add comment to ticket' })
  async addComment(
    @Param('id') id: string,
    @Body() body: { content: string; isInternal?: boolean },
    @Request() req: any,
  ) {
    return this.ticketsService.addComment(id, body, req.user.id, req.user.name);
  }

  @Delete(':id')
  @RequirePermissions('tickets:delete')
  @ApiOperation({ summary: 'Delete ticket' })
  async delete(@Param('id') id: string, @Request() req: any) {
    await this.ticketsService.delete(id, req.user.id, req.user.name);
    return { message: 'Ticket deleted successfully' };
  }
}
