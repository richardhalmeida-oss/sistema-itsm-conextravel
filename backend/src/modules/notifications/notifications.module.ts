import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationOrmEntity } from '@/infrastructure/database/entities';
import { NotificationRepositoryImpl } from '@/infrastructure/database/repositories/other.repository.impl';
import { NOTIFICATION_REPOSITORY } from '@/domain/repositories/notification.repository';
import { AuthModule } from '@/modules/auth/auth.module';
import { AuditModule } from '@/modules/audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationOrmEntity]),
    forwardRef(() => AuthModule),
    AuditModule,
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    { provide: NOTIFICATION_REPOSITORY, useClass: NotificationRepositoryImpl },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
