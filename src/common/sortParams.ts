import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SortParams {
  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
    description: '정렬 기준 지정. 최신순 / 조회순(views)',
    example: 'views',
  })
  sortBy?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: '기간 설정. week, month, year',
    example: 'week',
  })
  duration?: string;
}
