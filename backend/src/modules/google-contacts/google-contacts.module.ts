import { Module } from '@nestjs/common';
import { GoogleContactsService } from './google-contacts.service';

@Module({
  providers: [GoogleContactsService],
  exports: [GoogleContactsService],
})
export class GoogleContactsModule {}
