import { IsNumber, IsOptional, Min } from 'class-validator';

export class PaginationParams {
  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}
