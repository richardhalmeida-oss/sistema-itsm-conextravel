import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role, Permission, Group } from '@/domain/entities/role.entity';
import { IRoleRepository, IPermissionRepository, IGroupRepository } from '@/domain/repositories/role.repository';
import { FindAllOptions, PaginatedResult } from '@/domain/repositories/base.repository';
import { RoleOrmEntity, PermissionOrmEntity, GroupOrmEntity } from '../entities';
import { RoleMapper, PermissionMapper, GroupMapper } from '../mappers/user.mapper';

@Injectable()
export class RoleRepositoryImpl implements IRoleRepository {
  constructor(
    @InjectRepository(RoleOrmEntity)
    private readonly repo: Repository<RoleOrmEntity>,
    @InjectRepository(PermissionOrmEntity)
    private readonly permRepo: Repository<PermissionOrmEntity>,
  ) {}

  async findById(id: string): Promise<Role | null> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: ['permissions'],
    });
    return entity ? RoleMapper.toDomain(entity) : null;
  }

  async findByName(name: string): Promise<Role | null> {
    const entity = await this.repo.findOne({
      where: { name },
      relations: ['permissions'],
    });
    return entity ? RoleMapper.toDomain(entity) : null;
  }

  async findByIds(ids: string[]): Promise<Role[]> {
    if (ids.length === 0) return [];
    const entities = await this.repo.find({
      where: { id: In(ids) },
      relations: ['permissions'],
    });
    return entities.map(RoleMapper.toDomain);
  }

  async findAll(options?: FindAllOptions): Promise<PaginatedResult<Role>> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const [entities, total] = await this.repo.findAndCount({
      relations: ['permissions'],
      skip,
      take: limit,
      order: { name: 'ASC' },
    });

    return {
      data: entities.map(RoleMapper.toDomain),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(role: Role): Promise<Role> {
    const ormData = RoleMapper.toOrm(role);
    const entity = this.repo.create(ormData);

    if (role.permissionIds.length > 0) {
      entity.permissions = await this.permRepo.find({
        where: { id: In(role.permissionIds) },
      });
    }

    const saved = await this.repo.save(entity);
    return RoleMapper.toDomain(saved);
  }

  async update(role: Role): Promise<Role> {
    const existing = await this.repo.findOne({
      where: { id: role.id },
      relations: ['permissions'],
    });
    if (!existing) throw new Error(`Role not found: ${role.id}`);

    Object.assign(existing, RoleMapper.toOrm(role));

    if (role.permissionIds.length > 0) {
      existing.permissions = await this.permRepo.find({
        where: { id: In(role.permissionIds) },
      });
    } else {
      existing.permissions = [];
    }

    const saved = await this.repo.save(existing);
    return RoleMapper.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repo.count({ where: { id } });
    return count > 0;
  }
}

@Injectable()
export class PermissionRepositoryImpl implements IPermissionRepository {
  constructor(
    @InjectRepository(PermissionOrmEntity)
    private readonly repo: Repository<PermissionOrmEntity>,
  ) {}

  async findById(id: string): Promise<Permission | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? PermissionMapper.toDomain(entity) : null;
  }

  async findBySlug(slug: string): Promise<Permission | null> {
    const entity = await this.repo.findOne({ where: { slug } });
    return entity ? PermissionMapper.toDomain(entity) : null;
  }

  async findByResource(resource: string): Promise<Permission[]> {
    const entities = await this.repo.find({ where: { resource } });
    return entities.map(PermissionMapper.toDomain);
  }

  async findByIds(ids: string[]): Promise<Permission[]> {
    if (ids.length === 0) return [];
    const entities = await this.repo.find({ where: { id: In(ids) } });
    return entities.map(PermissionMapper.toDomain);
  }

  async findAll(options?: FindAllOptions): Promise<PaginatedResult<Permission>> {
    const page = options?.page || 1;
    const limit = options?.limit || 100;
    const skip = (page - 1) * limit;

    const [entities, total] = await this.repo.findAndCount({
      skip,
      take: limit,
      order: { resource: 'ASC', action: 'ASC' },
    });

    return {
      data: entities.map(PermissionMapper.toDomain),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(permission: Permission): Promise<Permission> {
    const ormData = PermissionMapper.toOrm(permission);
    const entity = this.repo.create(ormData);
    const saved = await this.repo.save(entity);
    return PermissionMapper.toDomain(saved);
  }

  async update(permission: Permission): Promise<Permission> {
    const ormData = PermissionMapper.toOrm(permission);
    await this.repo.update(permission.id, ormData);
    const updated = await this.repo.findOneOrFail({ where: { id: permission.id } });
    return PermissionMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repo.count({ where: { id } });
    return count > 0;
  }
}

@Injectable()
export class GroupRepositoryImpl implements IGroupRepository {
  constructor(
    @InjectRepository(GroupOrmEntity)
    private readonly repo: Repository<GroupOrmEntity>,
  ) {}

  async findById(id: string): Promise<Group | null> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: ['members'],
    });
    return entity ? GroupMapper.toDomain(entity) : null;
  }

  async findByName(name: string): Promise<Group | null> {
    const entity = await this.repo.findOne({
      where: { name },
      relations: ['members'],
    });
    return entity ? GroupMapper.toDomain(entity) : null;
  }

  async findByMemberId(userId: string): Promise<Group[]> {
    const entities = await this.repo
      .createQueryBuilder('g')
      .innerJoin('user_groups', 'ug', 'ug.group_id = g.id')
      .where('ug.user_id = :userId', { userId })
      .getMany();
    return entities.map(GroupMapper.toDomain);
  }

  async findAll(options?: FindAllOptions): Promise<PaginatedResult<Group>> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const [entities, total] = await this.repo.findAndCount({
      relations: ['members'],
      skip,
      take: limit,
      order: { name: 'ASC' },
    });

    return {
      data: entities.map(GroupMapper.toDomain),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(group: Group): Promise<Group> {
    const ormData = GroupMapper.toOrm(group);
    const entity = this.repo.create(ormData);
    const saved = await this.repo.save(entity);
    return GroupMapper.toDomain(saved);
  }

  async update(group: Group): Promise<Group> {
    const ormData = GroupMapper.toOrm(group);
    await this.repo.update(group.id, ormData);
    const updated = await this.repo.findOneOrFail({
      where: { id: group.id },
      relations: ['members'],
    });
    return GroupMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repo.count({ where: { id } });
    return count > 0;
  }
}
