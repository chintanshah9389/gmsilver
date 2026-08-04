import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendNotificationDto {
  @ApiProperty({ example: 'Special Offer!' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Get 10% off on all silver coins today!' })
  @IsString()
  body: string;

  @ApiPropertyOptional({
    example: 'product:uuid-here',
    description:
      'Optional deep link. Formats: product:<id>, order:<id>, https://..., or gmsilver://...',
  })
  @IsOptional()
  @IsString()
  link?: string;

  @ApiPropertyOptional()
  @IsOptional()
  data?: Record<string, string>;
}
