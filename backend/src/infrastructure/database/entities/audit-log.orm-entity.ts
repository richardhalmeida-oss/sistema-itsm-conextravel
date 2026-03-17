import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLogOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  @Index()
  userId!: string | null;

  @Column({ name: 'user_name' })
  userName!: string;

  @Column()
  @Index()
  action!: string;

  @Column()
  @Index()
  entity!: string;

  @Column({ name: 'entity_id', type: 'uuid', nullable: true })
  @Index()
  entityId!: string | null;

  @Column('jsonb', { nullable: true })
  before!: Record<string, unknown> | null;

  @Column('jsonb', { nullable: true })
  after!: Record<string, unknown> | null;

  @Column('jsonb', { default: '{}' })
  metadata!: Record<string, unknown>;

  @Column({ name: 'ip_address', type: 'text', nullable: true })
  ipAddress!: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  @Index()
  createdAt!: Date;
}
