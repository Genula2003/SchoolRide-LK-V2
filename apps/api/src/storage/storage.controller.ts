import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided for upload.');
    }
    return this.storageService.saveFile(userId, file);
  }

  @Get('files/:key')
  @UseGuards(JwtAuthGuard)
  async getFile(
    @CurrentUser() user: AuthenticatedUser,
    @Param('key') key: string,
    @Res() res: Response,
  ) {
    const fileResult = await this.storageService.getFileStream(user.id, user.role, key);
    fileResult.stream.pipe(res);
  }
}
