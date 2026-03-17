import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SlaService } from './sla.service';
import { RequireRoles, RolesGuard } from '@/modules/auth/guards/permissions.guard';

@ApiTags('SLA')
@Controller('sla')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
export class SlaController {
  constructor(private readonly slaService: SlaService) {}

  @Get('configs')
  @RequireRoles('admin')
  @ApiOperation({ summary: 'List all SLA configurations' })
  async listConfigs() {
    return this.slaService.findAllConfigs();
  }

  @Get('configs/:id')
  @RequireRoles('admin')
  @ApiOperation({ summary: 'Get SLA config by ID' })
  async getConfig(@Param('id') id: string) {
    return this.slaService.findConfigById(id);
  }

  @Post('configs')
  @RequireRoles('admin')
  @ApiOperation({ summary: 'Create SLA configuration' })
  async createConfig(@Body() body: any, @Request() req: any) {
    return this.slaService.createConfig(body, req.user.id, req.user.name);
  }

  @Put('configs/:id')
  @RequireRoles('admin')
  @ApiOperation({ summary: 'Update SLA configuration' })
  async updateConfig(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.slaService.updateConfig(id, body, req.user.id, req.user.name);
  }

  @Get('ticket/:ticketId')
  @ApiOperation({ summary: 'Get SLA log for a ticket' })
  async getSlaForTicket(@Param('ticketId') ticketId: string) {
    return this.slaService.getSlaForTicket(ticketId);
  }

  @Get('stats/breached')
  @ApiOperation({ summary: 'Get SLA breach count' })
  async getBreachedCount(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return {
      count: await this.slaService.getBreachedCount(
        dateFrom ? new Date(dateFrom) : undefined,
        dateTo ? new Date(dateTo) : undefined,
      ),
    };
  }

  @Get('stats/avg-resolution')
  @ApiOperation({ summary: 'Get average resolution time in minutes' })
  async getAvgResolutionTime(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return {
      averageMinutes: await this.slaService.getAverageResolutionTime(
        dateFrom ? new Date(dateFrom) : undefined,
        dateTo ? new Date(dateTo) : undefined,
      ),
    };
  }
}
