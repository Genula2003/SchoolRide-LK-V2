import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ParentsService } from './parents.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  UserRole,
  updateParentProfileSchema,
  createChildSchema,
  updateChildSchema,
} from '@schoolride/shared';

@Controller('parents')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PARENT, UserRole.ADMIN)
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Get('me')
  async getProfile(@CurrentUser('id') userId: string) {
    return this.parentsService.getProfile(userId);
  }

  @Patch('me/profile')
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() body: any,
  ) {
    const parseResult = updateParentProfileSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors[0].message);
    }
    return this.parentsService.updateProfile(userId, parseResult.data);
  }

  @Get('me/children')
  async getChildren(@CurrentUser('id') userId: string) {
    return this.parentsService.getChildren(userId);
  }

  @Post('me/children')
  async createChild(
    @CurrentUser('id') userId: string,
    @Body() body: any,
  ) {
    const parseResult = createChildSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors[0].message);
    }
    return this.parentsService.createChild(userId, parseResult.data);
  }

  @Patch('me/children/:id')
  async updateChild(
    @CurrentUser('id') userId: string,
    @Param('id') childId: string,
    @Body() body: any,
  ) {
    const parseResult = updateChildSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors[0].message);
    }
    return this.parentsService.updateChild(userId, childId, parseResult.data);
  }

  @Delete('me/children/:id')
  async deleteChild(
    @CurrentUser('id') userId: string,
    @Param('id') childId: string,
  ) {
    return this.parentsService.deleteChild(userId, childId);
  }
}
