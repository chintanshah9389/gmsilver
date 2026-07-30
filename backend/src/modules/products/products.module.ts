import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsStorageCleanupController } from './products-storage-cleanup.controller';
import { ProductsService } from './products.service';
import { StorageModule } from '../storage/storage.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StorageDeleteCleanupService } from './storage-delete-cleanup.service';

@Module({
  imports: [StorageModule, NotificationsModule],
  controllers: [ProductsController, ProductsStorageCleanupController],
  providers: [ProductsService, StorageDeleteCleanupService],
  exports: [ProductsService],
})
export class ProductsModule {}
