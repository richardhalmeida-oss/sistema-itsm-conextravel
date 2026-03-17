import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AutomationService } from './automation.service';
import { RequireRoles, RolesGuard } from '@/modules/auth/guards/permissions.guard';

@ApiTags('Automation')
@Controller('automation')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Get()
  @RequireRoles('admin')
  @ApiOperation({ summary: 'List all automation rules' })
  async findAll() {
    return this.automationService.findAll();
  }

  @Get(':id')
  @RequireRoles('admin')
  @ApiOperation({ summary: 'Get automation rule by ID' })
  async findById(@Param('id') id: string) {
    return this.automationService.findById(id);
  }

  @Post()
  @RequireRoles('admin')
  @ApiOperation({ summary: 'Create automation rule' })
  async create(@Body() body: any, @Request() req: any) {
    return this.automationService.create(body, req.user.id, req.user.name);
  }

  @Put(':id')
  @RequireRoles('admin')
  @ApiOperation({ summary: 'Update automation rule' })
  async update(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.automationService.update(id, body, req.user.id, req.user.name);
  }

  @Delete(':id')
  @RequireRoles('admin')
  @ApiOperation({ summary: 'Delete automation rule' })
  async delete(@Param('id') id: string, @Request() req: any) {
    await this.automationService.delete(id, req.user.id, req.user.name);
    return { message: 'Automation rule deleted' };
  }
}
