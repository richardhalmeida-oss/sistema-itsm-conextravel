import { User, UserStatus } from '@/domain/entities/user.entity';
import { Role, Permission, Group } from '@/domain/entities/role.entity';
import { UserOrmEntity, RoleOrmEntity, PermissionOrmEntity, GroupOrmEntity } from '../entities';

/**
 * Maps between Domain User and ORM UserEntity
 */
export class UserMapper {
  static toDomain(orm: UserOrmEntity): User {
    return new User({
      id: orm.id,
      email: orm.email,
      name: orm.name,
      passwordHash: orm.passwordHash,
      status: orm.status as UserStatus,
      roleIds: orm.roles ? orm.roles.map((r) => r.id) : [],
      groupIds: orm.groups ? orm.groups.map((g) => g.id) : [],
      refreshTokenHash: orm.refreshTokenHash,
      lastLoginAt: orm.lastLoginAt,
      failedLoginAttempts: orm.failedLoginAttempts,
      lockedUntil: orm.lockedUntil,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: User): Partial<UserOrmEntity> {
    return {
      id: domain.id,
      email: domain.email,
      name: domain.name,
      passwordHash: domain.passwordHash,
      status: domain.status,
      refreshTokenHash: domain.refreshTokenHash,
      lastLoginAt: domain.lastLoginAt,
      failedLoginAttempts: domain.failedLoginAttempts,
      lockedUntil: domain.lockedUntil,
    };
  }
}

export class RoleMapper {
  static toDomain(orm: RoleOrmEntity): Role {
    return new Role({
      id: orm.id,
      name: orm.name,
      description: orm.description,
      permissionIds: orm.permissions ? orm.permissions.map((p) => p.id) : [],
      isSystem: orm.isSystem,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: Role): Partial<RoleOrmEntity> {
    return {
      id: domain.id,
      name: domain.name,
      description: domain.description,
      isSystem: domain.isSystem,
    };
  }
}

export class PermissionMapper {
  static toDomain(orm: PermissionOrmEntity): Permission {
    return new Permission({
      id: orm.id,
      resource: orm.resource,
      action: orm.action,
      description: orm.description,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: Permission): Partial<PermissionOrmEntity> {
    return {
      id: domain.id,
      resource: domain.resource,
      action: domain.action,
      description: domain.description,
      slug: domain.slug,
    };
  }
}

export class GroupMapper {
  static toDomain(orm: GroupOrmEntity): Group {
    return new Group({
      id: orm.id,
      name: orm.name,
      description: orm.description,
      memberIds: orm.members ? orm.members.map((m) => m.id) : [],
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: Group): Partial<GroupOrmEntity> {
    return {
      id: domain.id,
      name: domain.name,
      description: domain.description,
    };
  }
}
