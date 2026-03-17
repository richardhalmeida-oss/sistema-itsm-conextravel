import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('sla_configs')
export class SlaConfigOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  description!: string;

  @Column({ type: 'text', nullable: true })
  priority!: string | null;

  @Column({ name: 'ticket_type', type: 'text', nullable: true })
  ticketType!: string | null;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId!: string | null;

  @Column({ name: 'response_time_minutes', type: 'int' })
  responseTimeMinutes!: number;

  @Column({ name: 'resolution_time_minutes', type: 'int' })
  resolutionTimeMinutes!: number;

  @Column('jsonb', { name: 'escalation_rules', default: '[]' })
  escalationRules!: Array<{
    level: number;
    triggerAfterMinutes: number;
    notifyUserIds: string[];
    notifyGroupIds: string[];
    autoReassign: boolean;
    reassignToUserId?: string;
    reassignToGroupId?: string;
  }>;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'is_default', default: false })
  isDefault!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

@Entity('sla_logs')
export class SlaLogOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'ticket_id' })
  @Index()
  ticketId!: string;

  @Column({ name: 'sla_config_id' })
  slaConfigId!: string;

  @Column({ default: 'running' })
  @Index()
  status!: string;

  @Column({ name: 'response_deadline', type: 'timestamptz' })
  responseDeadline!: Date;

  @Column({ name: 'resolution_deadline', type: 'timestamptz' })
  resolutionDeadline!: Date;

  @Column({ name: 'started_at', type: 'timestamptz' })
  startedAt!: Date;

  @Column({ name: 'paused_at', type: 'timestamptz', nullable: true })
  pausedAt!: Date | null;

  @Column({ name: 'total_paused_minutes', type: 'float', default: 0 })
  totalPausedMinutes!: number;

  @Column({ name: 'responded_at', type: 'timestamptz', nullable: true })
  respondedAt!: Date | null;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt!: Date | null;

  @Column({ name: 'response_breach', default: false })
  responseBreach!: boolean;

  @Column({ name: 'resolution_breach', default: false })
  resolutionBreach!: boolean;

  @Column({ name: 'current_escalation_level', type: 'int', default: 1 })
  currentEscalationLevel!: number;

  @Column('jsonb', { name: 'escalation_history', default: '[]' })
  escalationHistory!: Array<{
    fromLevel: number;
    toLevel: number;
    reason: string;
    escalatedAt: Date;
  }>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
