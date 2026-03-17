import { Category, TicketTemplate } from '../entities/category.entity';
import { IBaseRepository } from './base.repository';

export const CATEGORY_REPOSITORY = Symbol('CATEGORY_REPOSITORY');
export const TICKET_TEMPLATE_REPOSITORY = Symbol('TICKET_TEMPLATE_REPOSITORY');

export interface ICategoryRepository extends IBaseRepository<Category> {
  findByName(name: string): Promise<Category | null>;
  findRootCategories(): Promise<Category[]>;
  findSubcategories(parentId: string): Promise<Category[]>;
  findActive(): Promise<Category[]>;
}

export interface ITicketTemplateRepository extends IBaseRepository<TicketTemplate> {
  findByCategory(categoryId: string): Promise<TicketTemplate[]>;
  findActive(): Promise<TicketTemplate[]>;
}
