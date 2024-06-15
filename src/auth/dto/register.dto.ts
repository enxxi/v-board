import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @ApiProperty({ example: 'user' })
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]*$/, {
    message: '패스워드는 영어와 숫자를 포함하여 6자 이상 작성해주세요.',
  })
  @ApiProperty({ example: 'aa1234' })
  password: string;
}
