import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { TicketOrmEntity, SlaLogOrmEntity } from '@/infrastructure/database/entities';
import { TicketRepositoryImpl } from '@/infrastructure/database/repositories/ticket.repository.impl';
import { SlaLogRepositoryImpl } from '@/infrastructure/database/repositories/sla.repository.impl';
import { TICKET_REPOSITORY } from '@/domain/repositories/ticket.repository';
import { SLA_LOG_REPOSITORY } from '@/domain/repositories/sla.repository';
import { AuthModule } from '@/modules/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TicketOrmEntity, SlaLogOrmEntity]),
    forwardRef(() => AuthModule),
  ],
  controllers: [DashboardController],
  providers: [
    DashboardService,
    { provide: TICKET_REPOSITORY, useClass: TicketRepositoryImpl },
    { provide: SLA_LOG_REPOSITORY, useClass: SlaLogRepositoryImpl },
  ],
  exports: [DashboardService],
})
export class DashboardModule {}
