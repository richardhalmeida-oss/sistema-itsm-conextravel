import { SlaLog, SlaStatus, EscalationLevel } from '../domain/entities/sla.entity';

describe('SlaLog Entity', () => {
  let slaLog: SlaLog;

  beforeEach(() => {
    const now = new Date();
    const responseDeadline = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
    const resolutionDeadline = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8 hours

    slaLog = new SlaLog({
      ticketId: 'ticket-1',
      slaConfigId: 'config-1',
      responseDeadline,
      resolutionDeadline,
      startedAt: now,
    });
  });

  describe('creation', () => {
    it('should create with default values', () => {
      expect(slaLog.status).toBe(SlaStatus.RUNNING);
      expect(slaLog.totalPausedMinutes).toBe(0);
      expect(slaLog.respondedAt).toBeNull();
      expect(slaLog.resolvedAt).toBeNull();
      expect(slaLog.responseBreach).toBe(false);
      expect(slaLog.resolutionBreach).toBe(false);
      expect(slaLog.currentEscalationLevel).toBe(EscalationLevel.LEVEL_1);
    });
  });

  describe('pause/resume', () => {
    it('should pause a running SLA', () => {
      slaLog.pause();
      expect(slaLog.status).toBe(SlaStatus.PAUSED);
      expect(slaLog.pausedAt).toBeInstanceOf(Date);
    });

    it('should throw when pausing a non-running SLA', () => {
      slaLog.pause();
      expect(() => slaLog.pause()).toThrow('Cannot pause SLA');
    });

    it('should resume a paused SLA and accumulate paused time', () => {
      slaLog.pause();
      // Simulate some time passing (adjust pausedAt)
      const pausedAt = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
      (slaLog as any).pausedAt = pausedAt;

      slaLog.resume();
      expect(slaLog.status).toBe(SlaStatus.RUNNING);
      expect(slaLog.pausedAt).toBeNull();
      expect(slaLog.totalPausedMinutes).toBeGreaterThan(0);
    });

    it('should throw when resuming a non-paused SLA', () => {
      expect(() => slaLog.resume()).toThrow('Cannot resume SLA');
    });
  });

  describe('escalation', () => {
    it('should escalate from LEVEL_1 to LEVEL_2', () => {
      slaLog.escalate('Response time exceeded');
      expect(slaLog.currentEscalationLevel).toBe(EscalationLevel.LEVEL_2);
      expect(slaLog.escalationHistory).toHaveLength(1);
      expect(slaLog.escalationHistory[0].reason).toBe('Response time exceeded');
    });

    it('should escalate to LEVEL_3 max', () => {
      slaLog.escalate('Level 2');
      slaLog.escalate('Level 3');
      slaLog.escalate('Beyond max'); // Should not go beyond LEVEL_3
      expect(slaLog.currentEscalationLevel).toBe(EscalationLevel.LEVEL_3);
      expect(slaLog.escalationHistory).toHaveLength(2);
    });
  });

  describe('response/resolution recording', () => {
    it('should record first response', () => {
      slaLog.recordResponse();
      expect(slaLog.respondedAt).toBeInstanceOf(Date);
    });

    it('should not overwrite first response', () => {
      slaLog.recordResponse();
      const firstResponse = slaLog.respondedAt;
      slaLog.recordResponse();
      expect(slaLog.respondedAt).toBe(firstResponse);
    });

    it('should record resolution and set completed status', () => {
      slaLog.recordResolution();
      expect(slaLog.resolvedAt).toBeInstanceOf(Date);
      expect(slaLog.status).toBe(SlaStatus.COMPLETED);
    });
  });

  describe('elapsed time', () => {
    it('should calculate elapsed minutes', () => {
      const elapsed = slaLog.getElapsedMinutes();
      expect(elapsed).toBeGreaterThanOrEqual(0);
      expect(elapsed).toBeLessThan(1); // Just created
    });
  });
});
