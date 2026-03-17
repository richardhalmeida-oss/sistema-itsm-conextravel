import { Role, Permission, Group } from '../entities/role.entity';
import { IBaseRepository } from './base.repository';

export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');
export const PERMISSION_REPOSITORY = Symbol('PERMISSION_REPOSITORY');
export const GROUP_REPOSITORY = Symbol('GROUP_REPOSITORY');

export interface IRoleRepository extends IBaseRepository<Role> {
  findByName(name: string): Promise<Role | null>;
  findByIds(ids: string[]): Promise<Role[]>;
}

export interface IPermissionRepository extends IBaseRepository<Permission> {
  findBySlug(slug: string): Promise<Permission | null>;
  findByResource(resource: string): Promise<Permission[]>;
  findByIds(ids: string[]): Promise<Permission[]>;
}

export interface IGroupRepository extends IBaseRepository<Group> {
  findByName(name: string): Promise<Group | null>;
  findByMemberId(userId: string): Promise<Group[]>;
}
