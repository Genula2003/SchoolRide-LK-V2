import {
  Controller,
  Get,
  Post,
  Patch,
  Query,
  Param,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@schoolride/shared';

@Controller('schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Get()
  async listSchools(
    @Query('district') district?: string,
    @Query('query') query?: string,
  ) {
    return this.schoolsService.listSchools(district, query);
  }

  @Get(':id')
  async getSchoolById(@Param('id') id: string) {
    return this.schoolsService.getSchoolById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createSchool(@Body() body: any) {
    if (!body.name || !body.district || !body.latitude || !body.longitude) {
      throw new BadRequestException('Name, district, latitude, and longitude are required.');
    }
    return this.schoolsService.createSchool(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateSchool(@Param('id') id: string, @Body() body: any) {
    return this.schoolsService.updateSchool(id, body);
  }
}
