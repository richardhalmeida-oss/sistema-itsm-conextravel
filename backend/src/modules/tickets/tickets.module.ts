import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { TicketOrmEntity, TicketCommentOrmEntity, CategoryOrmEntity, TicketTemplateOrmEntity } from '@/infrastructure/database/entities';
import { TicketRepositoryImpl, TicketCommentRepositoryImpl } from '@/infrastructure/database/repositories/ticket.repository.impl';
import { TICKET_REPOSITORY, TICKET_COMMENT_REPOSITORY } from '@/domain/repositories/ticket.repository';
import { AuthModule } from '@/modules/auth/auth.module';
import { AuditModule } from '@/modules/audit/audit.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TicketOrmEntity, TicketCommentOrmEntity, CategoryOrmEntity, TicketTemplateOrmEntity]),
    forwardRef(() => AuthModule),
    AuditModule,
    NotificationsModule,
  ],
  controllers: [TicketsController],
  providers: [
    TicketsService,
    { provide: TICKET_REPOSITORY, useClass: TicketRepositoryImpl },
    { provide: TICKET_COMMENT_REPOSITORY, useClass: TicketCommentRepositoryImpl },
  ],
  exports: [TicketsService, TICKET_REPOSITORY],
})
export class TicketsModule {}
