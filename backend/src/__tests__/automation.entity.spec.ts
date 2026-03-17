import {
  AutomationRule,
  AutomationTrigger,
  ConditionOperator,
  AutomationActionType,
} from '../domain/entities/automation.entity';

describe('AutomationRule Entity', () => {
  let rule: AutomationRule;

  beforeEach(() => {
    rule = new AutomationRule({
      name: 'High Priority Alert',
      description: 'Alert when priority is high and time exceeds 10 minutes',
      trigger: AutomationTrigger.TICKET_UPDATED,
      conditions: [
        { field: 'priority', operator: ConditionOperator.EQUALS, value: 'high' },
        { field: 'elapsed_minutes', operator: ConditionOperator.GREATER_THAN, value: 10 },
      ],
      conditionLogic: 'AND',
      actions: [
        {
          type: AutomationActionType.SEND_NOTIFICATION,
          params: { message: 'High priority alert!' },
        },
        {
          type: AutomationActionType.ESCALATE,
          params: {},
        },
      ],
      createdById: 'admin-1',
    });
  });

  describe('condition evaluation - AND logic', () => {
    it('should match when ALL conditions are true', () => {
      const result = rule.evaluateConditions({
        priority: 'high',
        elapsed_minutes: 15,
      });
      expect(result).toBe(true);
    });

    it('should NOT match when any condition is false', () => {
      const result = rule.evaluateConditions({
        priority: 'low',
        elapsed_minutes: 15,
      });
      expect(result).toBe(false);
    });

    it('should NOT match when all conditions are false', () => {
      const result = rule.evaluateConditions({
        priority: 'low',
        elapsed_minutes: 5,
      });
      expect(result).toBe(false);
    });
  });

  describe('condition evaluation - OR logic', () => {
    it('should match when ANY condition is true', () => {
      rule.conditionLogic = 'OR';
      const result = rule.evaluateConditions({
        priority: 'high',
        elapsed_minutes: 5,
      });
      expect(result).toBe(true);
    });
  });

  describe('condition operators', () => {
    it('EQUALS', () => {
      const r = new AutomationRule({
        name: 'T', description: 'T', trigger: AutomationTrigger.TICKET_CREATED,
        conditions: [{ field: 'status', operator: ConditionOperator.EQUALS, value: 'open' }],
        actions: [], createdById: 'u1',
      });
      expect(r.evaluateConditions({ status: 'open' })).toBe(true);
      expect(r.evaluateConditions({ status: 'closed' })).toBe(false);
    });

    it('NOT_EQUALS', () => {
      const r = new AutomationRule({
        name: 'T', description: 'T', trigger: AutomationTrigger.TICKET_CREATED,
        conditions: [{ field: 'status', operator: ConditionOperator.NOT_EQUALS, value: 'closed' }],
        actions: [], createdById: 'u1',
      });
      expect(r.evaluateConditions({ status: 'open' })).toBe(true);
    });

    it('CONTAINS', () => {
      const r = new AutomationRule({
        name: 'T', description: 'T', trigger: AutomationTrigger.TICKET_CREATED,
        conditions: [{ field: 'title', operator: ConditionOperator.CONTAINS, value: 'VPN' }],
        actions: [], createdById: 'u1',
      });
      expect(r.evaluateConditions({ title: 'Problem with VPN access' })).toBe(true);
      expect(r.evaluateConditions({ title: 'Problem with email' })).toBe(false);
    });

    it('IN', () => {
      const r = new AutomationRule({
        name: 'T', description: 'T', trigger: AutomationTrigger.TICKET_CREATED,
        conditions: [{ field: 'priority', operator: ConditionOperator.IN, value: ['high', 'critical'] }],
        actions: [], createdById: 'u1',
      });
      expect(r.evaluateConditions({ priority: 'high' })).toBe(true);
      expect(r.evaluateConditions({ priority: 'low' })).toBe(false);
    });

    it('IS_NULL', () => {
      const r = new AutomationRule({
        name: 'T', description: 'T', trigger: AutomationTrigger.TICKET_CREATED,
        conditions: [{ field: 'assignedTo', operator: ConditionOperator.IS_NULL, value: null }],
        actions: [], createdById: 'u1',
      });
      expect(r.evaluateConditions({ assignedTo: null })).toBe(true);
      expect(r.evaluateConditions({ assignedTo: 'user-1' })).toBe(false);
    });
  });

  describe('execution tracking', () => {
    it('should track execution count', () => {
      expect(rule.executionCount).toBe(0);
      rule.recordExecution();
      expect(rule.executionCount).toBe(1);
      expect(rule.lastExecutedAt).toBeInstanceOf(Date);
    });
  });

  describe('empty conditions', () => {
    it('should match when no conditions exist', () => {
      const r = new AutomationRule({
        name: 'T', description: 'T', trigger: AutomationTrigger.TICKET_CREATED,
        conditions: [], actions: [], createdById: 'u1',
      });
      expect(r.evaluateConditions({})).toBe(true);
    });
  });
});
