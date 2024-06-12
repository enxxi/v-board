import { IsOptional, IsString } from 'class-validator';

export class SearchParams {
  @IsString()
  keyword: string;

  @IsOptional()
  @IsString()
  type: string;
}
