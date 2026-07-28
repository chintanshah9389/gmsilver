import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Storage')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload/image')
  @ApiOperation({ summary: 'Upload an image to Cloudflare R2' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: { type: 'string', example: 'products' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder = 'images',
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await this.storageService.uploadImage(
      file.buffer,
      file.originalname,
      file.mimetype,
      folder,
    );

    return { message: 'Image uploaded successfully', data: result };
  }

  @Delete(':storageKey(*)')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Delete a file from Cloudflare R2' })
  async deleteFile(@Param('storageKey') storageKey: string) {
    await this.storageService.deleteFile(storageKey);
    return { message: 'File deleted successfully' };
  }

  @Get('signed-url/:storageKey(*)')
  @ApiOperation({ summary: 'Get a signed URL for a private file' })
  async getSignedUrl(
    @Param('storageKey') storageKey: string,
    @Query('expiresIn') expiresIn = 3600,
  ) {
    const url = await this.storageService.getSignedUrl(storageKey, +expiresIn);
    return { data: { url } };
  }
}
