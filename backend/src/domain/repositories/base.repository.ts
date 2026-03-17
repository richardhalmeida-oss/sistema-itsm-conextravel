/**
 * Generic repository interface.
 * All domain repositories extend this.
 */
export interface IBaseRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(options?: FindAllOptions): Promise<PaginatedResult<T>>;
  create(entity: T): Promise<T>;
  update(entity: T): Promise<T>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}

export interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  filters?: Record<string, unknown>;
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
