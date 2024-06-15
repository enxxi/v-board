import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class PaginationParams {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiProperty({ required: false, description: '페이지네이션 offset 설정' })
  offset?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @ApiProperty({ required: false, description: '한 페이지에 띄울 limit 설정' })
  limit?: number;
}
