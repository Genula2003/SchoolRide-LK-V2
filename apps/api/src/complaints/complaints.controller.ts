import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ComplaintsService } from './complaints.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  UserRole,
  createComplaintSchema,
  resolveComplaintSchema,
} from '@schoolride/shared';

@Controller('complaints')
@UseGuards(JwtAuthGuard)
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Post()
  async createComplaint(
    @CurrentUser('id') userId: string,
    @Body() body: any,
  ) {
    const parseResult = createComplaintSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors[0].message);
    }
    return this.complaintsService.createComplaint(userId, parseResult.data);
  }

  @Get('my')
  async listMyComplaints(@CurrentUser('id') userId: string) {
    return this.complaintsService.listMyComplaints(userId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async listAllComplaints(
    @Query('status') status?: string,
    @Query('category') category?: string,
  ) {
    return this.complaintsService.listAllComplaints(status, category);
  }

  @Patch(':id/resolve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async resolveComplaint(
    @CurrentUser('id') adminId: string,
    @Param('id') complaintId: string,
    @Body() body: any,
  ) {
    const parseResult = resolveComplaintSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors[0].message);
    }
    return this.complaintsService.resolveComplaint(adminId, complaintId, parseResult.data);
  }
}
