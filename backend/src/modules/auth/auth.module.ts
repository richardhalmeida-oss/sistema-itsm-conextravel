import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PermissionsGuard, RolesGuard } from './guards/permissions.guard';
import { UserOrmEntity, RoleOrmEntity, PermissionOrmEntity, GroupOrmEntity } from '@/infrastructure/database/entities';
import { UserRepositoryImpl } from '@/infrastructure/database/repositories/user.repository.impl';
import { RoleRepositoryImpl, PermissionRepositoryImpl, GroupRepositoryImpl } from '@/infrastructure/database/repositories/role.repository.impl';
import { USER_REPOSITORY } from '@/domain/repositories/user.repository';
import { ROLE_REPOSITORY, PERMISSION_REPOSITORY, GROUP_REPOSITORY } from '@/domain/repositories/role.repository';
import { AuditModule } from '@/modules/audit/audit.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION', '15m'),
        },
      }),
    }),
    TypeOrmModule.forFeature([
      UserOrmEntity,
      RoleOrmEntity,
      PermissionOrmEntity,
      GroupOrmEntity,
    ]),
    forwardRef(() => AuditModule),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    PermissionsGuard,
    RolesGuard,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepositoryImpl,
    },
    {
      provide: ROLE_REPOSITORY,
      useClass: RoleRepositoryImpl,
    },
    {
      provide: PERMISSION_REPOSITORY,
      useClass: PermissionRepositoryImpl,
    },
    {
      provide: GROUP_REPOSITORY,
      useClass: GroupRepositoryImpl,
    },
  ],
  exports: [AuthService, JwtStrategy, PermissionsGuard, RolesGuard, USER_REPOSITORY, ROLE_REPOSITORY, PERMISSION_REPOSITORY, GROUP_REPOSITORY],
})
export class AuthModule {}
