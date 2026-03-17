import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditLogOrmEntity } from '@/infrastructure/database/entities';
import { AuditLogRepositoryImpl } from '@/infrastructure/database/repositories/audit.repository.impl';
import { AUDIT_LOG_REPOSITORY } from '@/domain/repositories/audit.repository';
import { AuthModule } from '@/modules/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLogOrmEntity]),
    forwardRef(() => AuthModule),
  ],
  controllers: [AuditController],
  providers: [
    AuditService,
    {
      provide: AUDIT_LOG_REPOSITORY,
      useClass: AuditLogRepositoryImpl,
    },
  ],
  exports: [AuditService],
})
export class AuditModule {}
