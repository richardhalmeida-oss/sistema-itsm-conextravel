import { BaseEntity } from './base.entity';

/**
 * Role Domain Entity.
 * Represents a system role (e.g., Admin, Technician).
 */
export class Role extends BaseEntity {
  public name: string;
  public description: string;
  public permissionIds: string[];
  public isSystem: boolean; // System roles cannot be deleted

  constructor(props: {
    id?: string;
    name: string;
    description: string;
    permissionIds?: string[];
    isSystem?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super(props.id, props.createdAt, props.updatedAt);
    this.name = props.name;
    this.description = props.description;
    this.permissionIds = props.permissionIds || [];
    this.isSystem = props.isSystem || false;
  }

  public hasPermission(permissionId: string): boolean {
    return this.permissionIds.includes(permissionId);
  }

  public addPermission(permissionId: string): void {
    if (!this.hasPermission(permissionId)) {
      this.permissionIds.push(permissionId);
      this.markUpdated();
    }
  }

  public removePermission(permissionId: string): void {
    this.permissionIds = this.permissionIds.filter((id) => id !== permissionId);
    this.markUpdated();
  }
}

/**
 * Permission Domain Entity.
 * Granular permission (e.g., tickets:create, sla:edit).
 */
export class Permission extends BaseEntity {
  public resource: string; // e.g., 'tickets', 'sla', 'users'
  public action: string; // e.g., 'create', 'read', 'update', 'delete'
  public description: string;

  constructor(props: {
    id?: string;
    resource: string;
    action: string;
    description: string;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super(props.id, props.createdAt, props.updatedAt);
    this.resource = props.resource;
    this.action = props.action;
    this.description = props.description;
  }

  public get slug(): string {
    return `${this.resource}:${this.action}`;
  }
}

/**
 * Group Domain Entity.
 * Organizational group (e.g., TI, Comercial).
 */
export class Group extends BaseEntity {
  public name: string;
  public description: string;
  public memberIds: string[];

  constructor(props: {
    id?: string;
    name: string;
    description: string;
    memberIds?: string[];
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super(props.id, props.createdAt, props.updatedAt);
    this.name = props.name;
    this.description = props.description;
    this.memberIds = props.memberIds || [];
  }

  public addMember(userId: string): void {
    if (!this.memberIds.includes(userId)) {
      this.memberIds.push(userId);
      this.markUpdated();
    }
  }

  public removeMember(userId: string): void {
    this.memberIds = this.memberIds.filter((id) => id !== userId);
    this.markUpdated();
  }

  public hasMember(userId: string): boolean {
    return this.memberIds.includes(userId);
  }
}
