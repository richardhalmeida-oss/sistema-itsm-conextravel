import { BaseEntity } from './base.entity';

/**
 * Category Domain Entity.
 * Ticket categories (e.g., Hardware, Software, Network).
 */
export class Category extends BaseEntity {
  public name: string;
  public description: string;
  public parentId: string | null;
  public isActive: boolean;
  public sortOrder: number;

  constructor(props: {
    id?: string;
    name: string;
    description: string;
    parentId?: string | null;
    isActive?: boolean;
    sortOrder?: number;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super(props.id, props.createdAt, props.updatedAt);
    this.name = props.name;
    this.description = props.description;
    this.parentId = props.parentId || null;
    this.isActive = props.isActive !== undefined ? props.isActive : true;
    this.sortOrder = props.sortOrder || 0;
  }

  public isSubcategory(): boolean {
    return this.parentId !== null;
  }
}

/**
 * TicketTemplate Domain Entity.
 * Predefined ticket templates for common scenarios.
 */
export class TicketTemplate extends BaseEntity {
  public name: string;
  public description: string;
  public categoryId: string | null;
  public defaultPriority: string;
  public defaultType: string;
  public titleTemplate: string;
  public descriptionTemplate: string;
  public customFieldDefinitions: CustomFieldDefinition[];
  public isActive: boolean;

  constructor(props: {
    id?: string;
    name: string;
    description: string;
    categoryId?: string | null;
    defaultPriority: string;
    defaultType: string;
    titleTemplate: string;
    descriptionTemplate: string;
    customFieldDefinitions?: CustomFieldDefinition[];
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super(props.id, props.createdAt, props.updatedAt);
    this.name = props.name;
    this.description = props.description;
    this.categoryId = props.categoryId || null;
    this.defaultPriority = props.defaultPriority;
    this.defaultType = props.defaultType;
    this.titleTemplate = props.titleTemplate;
    this.descriptionTemplate = props.descriptionTemplate;
    this.customFieldDefinitions = props.customFieldDefinitions || [];
    this.isActive = props.isActive !== undefined ? props.isActive : true;
  }
}

/**
 * Custom field definition for dynamic forms.
 */
export interface CustomFieldDefinition {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'boolean' | 'textarea';
  required: boolean;
  options?: string[]; // For select type
  defaultValue?: unknown;
  validationRules?: Record<string, unknown>;
}
