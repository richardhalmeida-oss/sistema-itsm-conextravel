import { Injectable, Inject } from '@nestjs/common';
import { ITicketRepository, TICKET_REPOSITORY } from '@/domain/repositories/ticket.repository';
import { ISlaLogRepository, SLA_LOG_REPOSITORY } from '@/domain/repositories/sla.repository';

export interface DashboardStats {
  tickets: {
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    openCount: number;
    resolvedToday: number;
  };
  sla: {
    breachedCount: number;
    avgResolutionMinutes: number;
    complianceRate: number;
  };
}

@Injectable()
export class DashboardService {
  constructor(
    @Inject(TICKET_REPOSITORY) private readonly ticketRepo: ITicketRepository,
    @Inject(SLA_LOG_REPOSITORY) private readonly slaLogRepo: ISlaLogRepository,
  ) {}

  async getStats(dateFrom?: Date, dateTo?: Date): Promise<DashboardStats> {
    const [byStatus, byPriority, breachedCount, avgResolution, totalSla] = await Promise.all([
      this.ticketRepo.countByStatus(),
      this.ticketRepo.countByPriority(),
      this.slaLogRepo.countBreached({ dateFrom, dateTo }),
      this.slaLogRepo.getAverageResolutionTime({ dateFrom, dateTo }),
      this.slaLogRepo.findAll({ limit: 1 }),
    ]);

    const total = Object.values(byStatus).reduce((sum, count) => sum + count, 0);
    const openCount = (byStatus['open'] || 0) + (byStatus['in_progress'] || 0);

    // Get today's resolved tickets
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayResult = await this.ticketRepo.findAll({
      status: 'resolved',
      dateFrom: today,
      limit: 1,
    });

    const totalSlaCount = totalSla.total || 1;
    const complianceRate = totalSlaCount > 0
      ? ((totalSlaCount - breachedCount) / totalSlaCount) * 100
      : 100;

    return {
      tickets: {
        total,
        byStatus,
        byPriority,
        openCount,
        resolvedToday: todayResult.total,
      },
      sla: {
        breachedCount,
        avgResolutionMinutes: Math.round(avgResolution * 100) / 100,
        complianceRate: Math.round(complianceRate * 100) / 100,
      },
    };
  }
}
