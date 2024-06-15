import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  content: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    required: false,
    description: '대댓글 기능을 위해 부모 댓글을 설정합니다.',
  })
  parentCommentId?: number;
}
