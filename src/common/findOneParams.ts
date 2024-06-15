import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

class FindOneParams {
  @IsInt()
  @IsPositive()
  @ApiProperty()
  id: number;
}

export default FindOneParams;
