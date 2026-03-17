import { BaseEntity } from './base.entity';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

/**
 * User Domain Entity.
 * Represents a system user with roles and permissions.
 */
export class User extends BaseEntity {
  public email: string;
  public name: string;
  public passwordHash: string;
  public status: UserStatus;
  public roleIds: string[];
  public groupIds: string[];
  public refreshTokenHash: string | null;
  public lastLoginAt: Date | null;
  public failedLoginAttempts: number;
  public lockedUntil: Date | null;

  constructor(props: {
    id?: string;
    email: string;
    name: string;
    passwordHash: string;
    status?: UserStatus;
    roleIds?: string[];
    groupIds?: string[];
    refreshTokenHash?: string | null;
    lastLoginAt?: Date | null;
    failedLoginAttempts?: number;
    lockedUntil?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super(props.id, props.createdAt, props.updatedAt);
    this.email = props.email;
    this.name = props.name;
    this.passwordHash = props.passwordHash;
    this.status = props.status || UserStatus.ACTIVE;
    this.roleIds = props.roleIds || [];
    this.groupIds = props.groupIds || [];
    this.refreshTokenHash = props.refreshTokenHash || null;
    this.lastLoginAt = props.lastLoginAt || null;
    this.failedLoginAttempts = props.failedLoginAttempts || 0;
    this.lockedUntil = props.lockedUntil || null;
  }

  public isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  public isLocked(): boolean {
    if (!this.lockedUntil) return false;
    return new Date() < this.lockedUntil;
  }

  public recordFailedLogin(maxAttempts: number = 5, lockDurationMinutes: number = 30): void {
    this.failedLoginAttempts += 1;
    if (this.failedLoginAttempts >= maxAttempts) {
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + lockDurationMinutes);
      this.lockedUntil = lockUntil;
    }
    this.markUpdated();
  }

  public recordSuccessfulLogin(): void {
    this.failedLoginAttempts = 0;
    this.lockedUntil = null;
    this.lastLoginAt = new Date();
    this.markUpdated();
  }

  public suspend(): void {
    this.status = UserStatus.SUSPENDED;
    this.markUpdated();
  }

  public activate(): void {
    this.status = UserStatus.ACTIVE;
    this.failedLoginAttempts = 0;
    this.lockedUntil = null;
    this.markUpdated();
  }

  public deactivate(): void {
    this.status = UserStatus.INACTIVE;
    this.markUpdated();
  }
}
