import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlaService } from './sla.service';
import { SlaController } from './sla.controller';
import { SlaConfigOrmEntity, SlaLogOrmEntity } from '@/infrastructure/database/entities';
import { SlaConfigRepositoryImpl, SlaLogRepositoryImpl } from '@/infrastructure/database/repositories/sla.repository.impl';
import { SLA_CONFIG_REPOSITORY, SLA_LOG_REPOSITORY } from '@/domain/repositories/sla.repository';
import { AuthModule } from '@/modules/auth/auth.module';
import { AuditModule } from '@/modules/audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SlaConfigOrmEntity, SlaLogOrmEntity]),
    forwardRef(() => AuthModule),
    AuditModule,
  ],
  controllers: [SlaController],
  providers: [
    SlaService,
    { provide: SLA_CONFIG_REPOSITORY, useClass: SlaConfigRepositoryImpl },
    { provide: SLA_LOG_REPOSITORY, useClass: SlaLogRepositoryImpl },
  ],
  exports: [SlaService, SLA_CONFIG_REPOSITORY, SLA_LOG_REPOSITORY],
})
export class SlaModule {}
