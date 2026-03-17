import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutomationService } from './automation.service';
import { AutomationController } from './automation.controller';
import { AutomationRuleOrmEntity } from '@/infrastructure/database/entities';
import { AutomationRepositoryImpl } from '@/infrastructure/database/repositories/other.repository.impl';
import { AUTOMATION_REPOSITORY } from '@/domain/repositories/automation.repository';
import { AuthModule } from '@/modules/auth/auth.module';
import { AuditModule } from '@/modules/audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AutomationRuleOrmEntity]),
    forwardRef(() => AuthModule),
    AuditModule,
  ],
  controllers: [AutomationController],
  providers: [
    AutomationService,
    { provide: AUTOMATION_REPOSITORY, useClass: AutomationRepositoryImpl },
  ],
  exports: [AutomationService],
})
export class AutomationModule {}
