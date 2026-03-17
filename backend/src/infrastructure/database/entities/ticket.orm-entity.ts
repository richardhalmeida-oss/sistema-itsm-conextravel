import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('tickets')
export class TicketOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column('text')
  description!: string;

  @Column({ default: 'open' })
  @Index()
  status!: string;

  @Column()
  @Index()
  priority!: string;

  @Column({ default: 'incident' })
  type!: string;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  @Index()
  categoryId!: string | null;

  @Column({ name: 'created_by_id' })
  @Index()
  createdById!: string;

  @Column({ name: 'assigned_to_id', type: 'uuid', nullable: true })
  @Index()
  assignedToId!: string | null;

  @Column({ name: 'group_id', type: 'uuid', nullable: true })
  @Index()
  groupId!: string | null;

  @Column({ name: 'sla_config_id', type: 'uuid', nullable: true })
  slaConfigId!: string | null;

  @Column({ name: 'parent_ticket_id', type: 'uuid', nullable: true })
  @Index()
  parentTicketId!: string | null;

  @Column('simple-array', { nullable: true })
  tags!: string[];

  @Column('jsonb', { name: 'custom_fields', default: '{}' })
  customFields!: Record<string, unknown>;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt!: Date | null;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt!: Date | null;

  @Column({ name: 'first_response_at', type: 'timestamptz', nullable: true })
  firstResponseAt!: Date | null;

  @Column({ name: 'due_date', type: 'timestamptz', nullable: true })
  dueDate!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

@Entity('ticket_comments')
export class TicketCommentOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'ticket_id' })
  @Index()
  ticketId!: string;

  @Column({ name: 'author_id' })
  authorId!: string;

  @Column('text')
  content!: string;

  @Column({ name: 'is_internal', default: false })
  isInternal!: boolean;

  @Column('jsonb', { default: '[]' })
  attachments!: Array<{
    id: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    storagePath: string;
    uploadedAt: Date;
  }>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

@Entity('categories')
export class CategoryOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  description!: string;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId!: string | null;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

@Entity('ticket_templates')
export class TicketTemplateOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  description!: string;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId!: string | null;

  @Column({ name: 'default_priority' })
  defaultPriority!: string;

  @Column({ name: 'default_type' })
  defaultType!: string;

  @Column({ name: 'title_template' })
  titleTemplate!: string;

  @Column({ name: 'description_template', type: 'text' })
  descriptionTemplate!: string;

  @Column('jsonb', { name: 'custom_field_definitions', default: '[]' })
  customFieldDefinitions!: Array<{
    name: string;
    label: string;
    type: string;
    required: boolean;
    options?: string[];
    defaultValue?: unknown;
    validationRules?: Record<string, unknown>;
  }>;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
