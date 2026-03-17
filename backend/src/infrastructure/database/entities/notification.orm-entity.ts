import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('notifications')
export class NotificationOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column()
  type!: string;

  @Column({ default: 'pending' })
  @Index()
  status!: string;

  @Column({ name: 'recipient_id', type: 'uuid', nullable: true })
  @Index()
  recipientId!: string | null;

  @Column({ name: 'recipient_email', type: 'text', nullable: true })
  recipientEmail!: string | null;

  @Column()
  title!: string;

  @Column('text')
  content!: string;

  @Column('jsonb', { default: '{}' })
  metadata!: Record<string, unknown>;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt!: Date | null;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt!: Date | null;

  @Column({ name: 'retry_count', default: 0 })
  retryCount!: number;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
