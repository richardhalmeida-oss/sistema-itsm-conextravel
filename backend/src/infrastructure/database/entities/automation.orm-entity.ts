import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('automation_rules')
export class AutomationRuleOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  description!: string;

  @Column()
  @Index()
  trigger!: string;

  @Column('jsonb', { default: '[]' })
  conditions!: Array<{
    field: string;
    operator: string;
    value: unknown;
  }>;

  @Column({ name: 'condition_logic', default: 'AND' })
  conditionLogic!: string;

  @Column('jsonb', { default: '[]' })
  actions!: Array<{
    type: string;
    params: Record<string, unknown>;
  }>;

  @Column({ name: 'is_active', default: true })
  @Index()
  isActive!: boolean;

  @Column({ default: 0 })
  priority!: number;

  @Column({ name: 'execution_count', default: 0 })
  executionCount!: number;

  @Column({ name: 'last_executed_at', type: 'timestamptz', nullable: true })
  lastExecutedAt!: Date | null;

  @Column({ name: 'created_by_id' })
  createdById!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
