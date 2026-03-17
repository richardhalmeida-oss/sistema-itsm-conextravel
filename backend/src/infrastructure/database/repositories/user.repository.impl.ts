import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from '@/domain/entities/user.entity';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { FindAllOptions, PaginatedResult } from '@/domain/repositories/base.repository';
import { UserOrmEntity, RoleOrmEntity } from '../entities';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class UserRepositoryImpl implements IUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repo: Repository<UserOrmEntity>,
    @InjectRepository(RoleOrmEntity)
    private readonly roleRepo: Repository<RoleOrmEntity>,
  ) {}

  async findById(id: string): Promise<User | null> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: ['roles', 'roles.permissions', 'groups'],
    });
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.repo.findOne({
      where: { email },
      relations: ['roles', 'roles.permissions', 'groups'],
    });
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return [];
    const entities = await this.repo.find({
      where: { id: In(ids) },
      relations: ['roles', 'roles.permissions'],
    });
    return entities.map(UserMapper.toDomain);
  }

  async findAll(options?: FindAllOptions): Promise<PaginatedResult<User>> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .leftJoinAndSelect('role.permissions', 'permission');

    // Apply filters
    if (options?.filters) {
      if (options.filters['status']) {
        queryBuilder.andWhere('user.status = :status', {
          status: options.filters['status'],
        });
      }
    }

    // Apply search
    if (options?.search) {
      queryBuilder.andWhere(
        '(user.name ILIKE :search OR user.email ILIKE :search)',
        { search: `%${options.search}%` },
      );
    }

    // Apply sorting
    const sortBy = options?.sortBy || 'createdAt';
    const sortOrder = options?.sortOrder || 'DESC';
    queryBuilder.orderBy(`user.${sortBy}`, sortOrder);

    const [entities, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: entities.map(UserMapper.toDomain),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(user: User): Promise<User> {
    const ormData = UserMapper.toOrm(user);
    const entity = this.repo.create(ormData);

    // Handle roles
    if (user.roleIds.length > 0) {
      entity.roles = await this.roleRepo.find({
        where: { id: In(user.roleIds) },
      });
    }

    const saved = await this.repo.save(entity);
    return UserMapper.toDomain(saved);
  }

  async update(user: User): Promise<User> {
    const ormData = UserMapper.toOrm(user);

    // Get existing entity with relations
    const existing = await this.repo.findOne({
      where: { id: user.id },
      relations: ['roles'],
    });

    if (!existing) {
      throw new Error(`User not found: ${user.id}`);
    }

    // Update scalar fields
    Object.assign(existing, ormData);

    // Update roles if changed
    if (user.roleIds.length > 0) {
      existing.roles = await this.roleRepo.find({
        where: { id: In(user.roleIds) },
      });
    }

    const saved = await this.repo.save(existing);
    return UserMapper.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repo.count({ where: { id } });
    return count > 0;
  }

  async updateRefreshToken(userId: string, refreshTokenHash: string | null): Promise<void> {
    await this.repo.update(userId, { refreshTokenHash });
  }
}
