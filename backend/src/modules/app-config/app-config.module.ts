import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { AppConfigController } from './app-config.controller';
import { AppConfigService } from './app-config.service';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [AppConfigController],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
