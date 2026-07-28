import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendNotificationDto {
  @ApiProperty({ example: 'Special Offer!' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Get 10% off on all silver coins today!' })
  @IsString()
  body: string;

  @ApiPropertyOptional()
  @IsOptional()
  data?: Record<string, string>;
}
