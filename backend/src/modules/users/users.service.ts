import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from '@/domain/entities/user.entity';
import { IUserRepository, USER_REPOSITORY } from '@/domain/repositories/user.repository';
import { IRoleRepository, ROLE_REPOSITORY } from '@/domain/repositories/role.repository';
import { IGroupRepository, GROUP_REPOSITORY } from '@/domain/repositories/role.repository';
import { AuditService } from '@/modules/audit/audit.service';
import { AuditAction } from '@/domain/entities/audit-log.entity';
import { FindAllOptions } from '@/domain/repositories/base.repository';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: IRoleRepository,
    @Inject(GROUP_REPOSITORY) private readonly groupRepository: IGroupRepository,
    private readonly auditService: AuditService,
  ) {}

  async findAll(options?: FindAllOptions) {
    return this.userRepository.findAll(options);
  }

  async findById(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException(`User not found: ${id}`);
    return user;
  }

  async create(data: {
    email: string;
    name: string;
    password: string;
    roleIds?: string[];
    groupIds?: string[];
  }, actorId: string, actorName: string) {
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(data.password, 12);
    
    let roleIds = data.roleIds || [];
    if (roleIds.length === 0) {
      const defaultRole = await this.roleRepository.findByName('user');
      if (defaultRole) roleIds = [defaultRole.id];
    }

    const user = new User({
      email: data.email,
      name: data.name,
      passwordHash,
      roleIds,
      groupIds: data.groupIds || [],
    });

    const saved = await this.userRepository.create(user);

    await this.auditService.log({
      userId: actorId,
      userName: actorName,
      action: AuditAction.CREATE,
      entity: 'user',
      entityId: saved.id,
      after: { email: saved.email, name: saved.name, roleIds: saved.roleIds },
    });

    return saved;
  }

  async update(
    id: string,
    data: { name?: string; email?: string; status?: UserStatus; roleIds?: string[]; groupIds?: string[] },
    actorId: string,
    actorName: string,
  ) {
    const user = await this.findById(id);
    const before = { name: user.name, email: user.email, status: user.status, roleIds: user.roleIds };

    if (data.name) user.name = data.name;
    if (data.email) {
      const existingWithEmail = await this.userRepository.findByEmail(data.email);
      if (existingWithEmail && existingWithEmail.id !== id) {
        throw new ConflictException('Email already in use');
      }
      user.email = data.email;
    }
    if (data.status) {
      switch (data.status) {
        case UserStatus.ACTIVE:
          user.activate();
          break;
        case UserStatus.INACTIVE:
          user.deactivate();
          break;
        case UserStatus.SUSPENDED:
          user.suspend();
          break;
      }
    }
    if (data.roleIds) user.roleIds = data.roleIds;
    if (data.groupIds) user.groupIds = data.groupIds;

    user.markUpdated();
    const updated = await this.userRepository.update(user);

    await this.auditService.log({
      userId: actorId,
      userName: actorName,
      action: AuditAction.UPDATE,
      entity: 'user',
      entityId: id,
      before,
      after: { name: updated.name, email: updated.email, status: updated.status, roleIds: updated.roleIds },
    });

    return updated;
  }

  async delete(id: string, actorId: string, actorName: string) {
    const user = await this.findById(id);
    await this.userRepository.delete(id);

    await this.auditService.log({
      userId: actorId,
      userName: actorName,
      action: AuditAction.DELETE,
      entity: 'user',
      entityId: id,
      before: { email: user.email, name: user.name },
    });
  }

  // Role-related operations
  async findAllRoles() {
    return this.roleRepository.findAll();
  }

  async findAllGroups() {
    return this.groupRepository.findAll();
  }
}
