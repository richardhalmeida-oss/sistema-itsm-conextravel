import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { RequireRoles, RolesGuard } from '@/modules/auth/guards/permissions.guard';
import { UserStatus } from '@/domain/entities/user.entity';

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequireRoles('admin')
  @ApiOperation({ summary: 'List all users' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.usersService.findAll({
      page, limit, search,
      filters: status ? { status } : undefined,
    });
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req: any) {
    return this.usersService.findById(req.user.id);
  }

  @Get('roles')
  @RequireRoles('admin')
  @ApiOperation({ summary: 'List all roles' })
  async listRoles() {
    return this.usersService.findAllRoles();
  }

  @Get('groups')
  @RequireRoles('admin')
  @ApiOperation({ summary: 'List all groups' })
  async listGroups() {
    return this.usersService.findAllGroups();
  }

  @Get(':id')
  @RequireRoles('admin')
  @ApiOperation({ summary: 'Get user by ID' })
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  @RequireRoles('admin')
  @ApiOperation({ summary: 'Create a new user' })
  async create(
    @Body() body: { email: string; name: string; password: string; roleIds?: string[]; groupIds?: string[] },
    @Request() req: any,
  ) {
    return this.usersService.create(body, req.user.id, req.user.name);
  }

  @Put(':id')
  @RequireRoles('admin')
  @ApiOperation({ summary: 'Update a user' })
  async update(
    @Param('id') id: string,
    @Body() body: { name?: string; email?: string; status?: UserStatus; roleIds?: string[]; groupIds?: string[] },
    @Request() req: any,
  ) {
    return this.usersService.update(id, body, req.user.id, req.user.name);
  }

  @Delete(':id')
  @RequireRoles('admin')
  @ApiOperation({ summary: 'Delete a user' })
  async delete(@Param('id') id: string, @Request() req: any) {
    await this.usersService.delete(id, req.user.id, req.user.name);
    return { message: 'User deleted successfully' };
  }
}
