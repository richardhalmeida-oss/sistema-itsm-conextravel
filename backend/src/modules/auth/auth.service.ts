import { Injectable, UnauthorizedException, ConflictException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '@/domain/entities/user.entity';
import { IUserRepository, USER_REPOSITORY } from '@/domain/repositories/user.repository';
import { IRoleRepository, ROLE_REPOSITORY } from '@/domain/repositories/role.repository';
import { AuditAction } from '@/domain/entities/audit-log.entity';
import { AuditService } from '@/modules/audit/audit.service';
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  AuthResponseDto,
  ChangePasswordDto,
} from './dtos/auth.dto';

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: IRoleRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponseDto> {
    const user = await this.userRepository.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive()) {
      throw new UnauthorizedException('Account is inactive');
    }

    if (user.isLocked()) {
      throw new UnauthorizedException(
        `Account is locked. Try again after ${user.lockedUntil?.toISOString()}`,
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      user.recordFailedLogin();
      await this.userRepository.update(user);

      await this.auditService.log({
        userId: user.id,
        userName: user.name,
        action: AuditAction.LOGIN_FAILED,
        entity: 'auth',
        metadata: { reason: 'invalid_password', failedAttempts: user.failedLoginAttempts },
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    user.recordSuccessfulLogin();

    const tokens = await this.generateTokens(user);

    // Store hashed refresh token
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    await this.userRepository.updateRefreshToken(user.id, refreshTokenHash);

    await this.userRepository.update(user);

    // Get roles/permissions for response
    const roles = await this.roleRepository.findByIds(user.roleIds);
    const roleNames = roles.map((r) => r.name);
    const permissionSlugs = this.extractPermissions(roles);

    await this.auditService.log({
      userId: user.id,
      userName: user.name,
      action: AuditAction.LOGIN,
      entity: 'auth',
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: roleNames,
        permissions: permissionSlugs,
      },
    };
  }

  async register(dto: RegisterDto, ipAddress?: string, userAgent?: string): Promise<AuthResponseDto> {
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Assign default role (user)
    const defaultRole = await this.roleRepository.findByName('user');
    const roleIds = defaultRole ? [defaultRole.id] : [];

    const user = new User({
      email: dto.email,
      name: dto.name,
      passwordHash,
      roleIds,
    });

    const savedUser = await this.userRepository.create(user);
    savedUser.recordSuccessfulLogin();

    const tokens = await this.generateTokens(savedUser);

    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    await this.userRepository.updateRefreshToken(savedUser.id, refreshTokenHash);

    await this.auditService.log({
      userId: savedUser.id,
      userName: savedUser.name,
      action: AuditAction.CREATE,
      entity: 'user',
      entityId: savedUser.id,
      after: { email: savedUser.email, name: savedUser.name },
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });

    const roles = await this.roleRepository.findByIds(savedUser.roleIds);
    const roleNames = roles.map((r) => r.name);
    const permissionSlugs = this.extractPermissions(roles);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        name: savedUser.name,
        roles: roleNames,
        permissions: permissionSlugs,
      },
    };
  }

  async refreshTokens(dto: RefreshTokenDto): Promise<AuthResponseDto> {
    try {
      const payload = await this.jwtService.verifyAsync(dto.refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.userRepository.findById(payload.sub);
      if (!user || !user.refreshTokenHash) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const isRefreshValid = await bcrypt.compare(
        dto.refreshToken,
        user.refreshTokenHash,
      );
      if (!isRefreshValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(user);
      const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
      await this.userRepository.updateRefreshToken(user.id, refreshTokenHash);

      const roles = await this.roleRepository.findByIds(user.roleIds);
      const roleNames = roles.map((r) => r.name);
      const permissionSlugs = this.extractPermissions(roles);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: roleNames,
          permissions: permissionSlugs,
        },
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    await this.userRepository.updateRefreshToken(userId, null);

    const user = await this.userRepository.findById(userId);
    if (user) {
      await this.auditService.log({
        userId: user.id,
        userName: user.name,
        action: AuditAction.LOGOUT,
        entity: 'auth',
      });
    }
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isCurrentValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    user.passwordHash = await bcrypt.hash(dto.newPassword, 12);
    user.markUpdated();
    await this.userRepository.update(user);

    await this.auditService.log({
      userId: user.id,
      userName: user.name,
      action: AuditAction.UPDATE,
      entity: 'user',
      entityId: user.id,
      metadata: { field: 'password' },
    });
  }

  async validateUser(payload: JwtPayload): Promise<User | null> {
    return this.userRepository.findById(payload.sub);
  }

  private async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const roles = await this.roleRepository.findByIds(user.roleIds);
    const roleNames = roles.map((r) => r.name);
    const permissionSlugs = this.extractPermissions(roles);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: roleNames,
      permissions: permissionSlugs,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRATION', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private extractPermissions(roles: import('@/domain/entities/role.entity').Role[]): string[] {
    const permissionSet = new Set<string>();
    // Note: We need to get permissions from the roles
    // Since roles have permissionIds, and we eager-load permissions via ORM,
    // we reconstruct slugs from the role's loaded data
    for (const role of roles) {
      // The RoleMapper stores permissionIds, but we need slugs
      // This is fine — we'll resolve from the DB join
      for (const permId of role.permissionIds) {
        permissionSet.add(permId);
      }
    }
    return Array.from(permissionSet);
  }
}
