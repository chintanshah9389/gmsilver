import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class BulkDeleteProductsDto {
  @ApiProperty({
    type: [String],
    description: 'Product IDs selected from checkbox list',
    example: ['f9a66de4-8f23-4f9e-b3f5-09a4f8d2c642', 'ccbe3d70-f547-4f39-9b80-a7418144b572'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  ids: string[];
}
