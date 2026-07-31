import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { HomeWidgetsController } from './home-widgets.controller';
import { HomeWidgetsService } from './home-widgets.service';

@Module({
  imports: [PrismaModule],
  controllers: [HomeWidgetsController],
  providers: [HomeWidgetsService],
  exports: [HomeWidgetsService],
})
export class HomeWidgetsModule {}