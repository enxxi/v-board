import { IsOptional, IsString } from 'class-validator';

export class SortParams {
  @IsString()
  @IsOptional()
  sortBy?: string;

  @IsOptional()
  @IsString()
  duration?: string;
}
