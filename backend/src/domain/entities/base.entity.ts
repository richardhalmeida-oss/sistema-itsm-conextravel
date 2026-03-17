import { v4 as uuidv4 } from 'uuid';

/**
 * Base entity for all domain entities.
 * Provides common fields: id, timestamps.
 */
export abstract class BaseEntity {
  public readonly id: string;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(id?: string, createdAt?: Date, updatedAt?: Date) {
    this.id = id || uuidv4();
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  public markUpdated(): void {
    this.updatedAt = new Date();
  }

  public equals(other: BaseEntity): boolean {
    if (!other) return false;
    return this.id === other.id;
  }
}
