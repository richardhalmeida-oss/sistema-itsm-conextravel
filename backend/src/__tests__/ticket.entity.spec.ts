import { Ticket, TicketStatus, TicketPriority, TicketType } from '../domain/entities/ticket.entity';

describe('Ticket Entity', () => {
  let ticket: Ticket;

  beforeEach(() => {
    ticket = new Ticket({
      title: 'Test Ticket',
      description: 'Test Description',
      priority: TicketPriority.MEDIUM,
      type: TicketType.INCIDENT,
      createdById: 'user-id-1',
    });
  });

  describe('creation', () => {
    it('should create a ticket with default values', () => {
      expect(ticket.id).toBeDefined();
      expect(ticket.status).toBe(TicketStatus.OPEN);
      expect(ticket.type).toBe(TicketType.INCIDENT);
      expect(ticket.tags).toEqual([]);
      expect(ticket.customFields).toEqual({});
      expect(ticket.parentTicketId).toBeNull();
    });

    it('should create a ticket with provided values', () => {
      const customTicket = new Ticket({
        title: 'Custom',
        description: 'Desc',
        priority: TicketPriority.CRITICAL,
        type: TicketType.CHANGE,
        createdById: 'user-1',
        tags: ['tag1'],
        customFields: { field1: 'value1' },
      });
      expect(customTicket.priority).toBe(TicketPriority.CRITICAL);
      expect(customTicket.type).toBe(TicketType.CHANGE);
      expect(customTicket.tags).toEqual(['tag1']);
    });
  });

  describe('status transitions', () => {
    it('should transition from OPEN to IN_PROGRESS', () => {
      ticket.transitionTo(TicketStatus.IN_PROGRESS);
      expect(ticket.status).toBe(TicketStatus.IN_PROGRESS);
    });

    it('should transition from IN_PROGRESS to WAITING_CLIENT', () => {
      ticket.transitionTo(TicketStatus.IN_PROGRESS);
      ticket.transitionTo(TicketStatus.WAITING_CLIENT);
      expect(ticket.status).toBe(TicketStatus.WAITING_CLIENT);
    });

    it('should transition from IN_PROGRESS to RESOLVED', () => {
      ticket.transitionTo(TicketStatus.IN_PROGRESS);
      ticket.transitionTo(TicketStatus.RESOLVED);
      expect(ticket.status).toBe(TicketStatus.RESOLVED);
      expect(ticket.resolvedAt).toBeInstanceOf(Date);
    });

    it('should transition from RESOLVED to CLOSED', () => {
      ticket.transitionTo(TicketStatus.IN_PROGRESS);
      ticket.transitionTo(TicketStatus.RESOLVED);
      ticket.transitionTo(TicketStatus.CLOSED);
      expect(ticket.status).toBe(TicketStatus.CLOSED);
      expect(ticket.closedAt).toBeInstanceOf(Date);
    });

    it('should throw on invalid transition OPEN -> RESOLVED', () => {
      expect(() => ticket.transitionTo(TicketStatus.RESOLVED)).toThrow(
        'Invalid status transition',
      );
    });

    it('should throw on invalid transition CLOSED -> anything', () => {
      ticket.transitionTo(TicketStatus.IN_PROGRESS);
      ticket.transitionTo(TicketStatus.RESOLVED);
      ticket.transitionTo(TicketStatus.CLOSED);
      expect(() => ticket.transitionTo(TicketStatus.OPEN)).toThrow(
        'Invalid status transition',
      );
    });
  });

  describe('assignment', () => {
    it('should assign and auto-transition to IN_PROGRESS', () => {
      ticket.assignTo('user-2');
      expect(ticket.assignedToId).toBe('user-2');
      expect(ticket.status).toBe(TicketStatus.IN_PROGRESS);
    });

    it('should throw when assigning a closed ticket', () => {
      ticket.transitionTo(TicketStatus.IN_PROGRESS);
      ticket.transitionTo(TicketStatus.RESOLVED);
      ticket.transitionTo(TicketStatus.CLOSED);
      expect(() => ticket.assignTo('user-2')).toThrow('Cannot assign');
    });
  });

  describe('SLA pause detection', () => {
    it('should pause SLA for WAITING_CLIENT', () => {
      ticket.transitionTo(TicketStatus.IN_PROGRESS);
      ticket.transitionTo(TicketStatus.WAITING_CLIENT);
      expect(ticket.shouldPauseSla()).toBe(true);
    });

    it('should not pause SLA for IN_PROGRESS', () => {
      ticket.transitionTo(TicketStatus.IN_PROGRESS);
      expect(ticket.shouldPauseSla()).toBe(false);
    });
  });

  describe('priority escalation', () => {
    it('should escalate from LOW to MEDIUM', () => {
      const lowTicket = new Ticket({
        title: 'Low',
        description: 'D',
        priority: TicketPriority.LOW,
        createdById: 'u1',
      });
      lowTicket.escalatePriority();
      expect(lowTicket.priority).toBe(TicketPriority.MEDIUM);
    });

    it('should not escalate beyond CRITICAL', () => {
      const criticalTicket = new Ticket({
        title: 'Critical',
        description: 'D',
        priority: TicketPriority.CRITICAL,
        createdById: 'u1',
      });
      criticalTicket.escalatePriority();
      expect(criticalTicket.priority).toBe(TicketPriority.CRITICAL);
    });
  });

  describe('tags', () => {
    it('should add tags (normalized lowercase)', () => {
      ticket.addTag('VPN');
      ticket.addTag('  network  ');
      expect(ticket.tags).toContain('vpn');
      expect(ticket.tags).toContain('network');
    });

    it('should not add duplicate tags', () => {
      ticket.addTag('vpn');
      ticket.addTag('VPN');
      expect(ticket.tags.length).toBe(1);
    });

    it('should remove tags', () => {
      ticket.addTag('vpn');
      ticket.removeTag('VPN');
      expect(ticket.tags).not.toContain('vpn');
    });
  });

  describe('subtask support', () => {
    it('should identify subtasks', () => {
      expect(ticket.isSubtask()).toBe(false);

      const subtask = new Ticket({
        title: 'Subtask',
        description: 'D',
        priority: TicketPriority.LOW,
        createdById: 'u1',
        parentTicketId: 'parent-1',
      });
      expect(subtask.isSubtask()).toBe(true);
    });
  });

  describe('terminal state', () => {
    it('should identify terminal states', () => {
      expect(ticket.isTerminal()).toBe(false);
      ticket.transitionTo(TicketStatus.IN_PROGRESS);
      ticket.transitionTo(TicketStatus.RESOLVED);
      ticket.transitionTo(TicketStatus.CLOSED);
      expect(ticket.isTerminal()).toBe(true);
    });
  });
});
