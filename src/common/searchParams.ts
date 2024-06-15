import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SearchParams {
  @IsString()
  @ApiProperty({ description: '검색 키워드', required: false })
  keyword: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '검색 조건 지정. title / author',
    example: 'title',
    required: false,
  })
  type: string;
}
