import { AutomationRule, AutomationTrigger } from '../entities/automation.entity';
import { IBaseRepository } from './base.repository';

export const AUTOMATION_REPOSITORY = Symbol('AUTOMATION_REPOSITORY');

export interface IAutomationRepository extends IBaseRepository<AutomationRule> {
  findByTrigger(trigger: AutomationTrigger): Promise<AutomationRule[]>;
  findActive(): Promise<AutomationRule[]>;
}
