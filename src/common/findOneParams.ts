import { IsInt, IsNumberString, IsPositive } from 'class-validator';

class FindOneParams {
  @IsInt()
  @IsPositive()
  id: number;
}

export default FindOneParams;
