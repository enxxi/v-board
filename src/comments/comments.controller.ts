import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/createComment.dto';
import JwtAuthGuard from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { UpdateCommentDto } from './dto/updateComment.dto';

@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('posts/:postId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  async postComment(
    @Param('postId') postId: number,
    @Body() comment: CreateCommentDto,
    @GetUser() user: User,
  ) {
    return await this.commentsService.createComment(postId, comment, user);
  }

  @Get()
  async getCommentsOfPost(@Param('postId') postId: number) {
    return await this.commentsService.getCommentsByPostId(postId);
  }

  @Patch(':commentId')
  async updateComment(
    @Param('commentId') commentId: number,
    @GetUser() user: User,
    @Body() comment: UpdateCommentDto,
  ) {
    return await this.commentsService.updateComment(commentId, comment, user);
  }

  @Delete(':commentId')
  async deleteComment(
    @Param('commentId') commentId: number,
    @GetUser() user: User,
  ) {
    return await this.commentsService.deleteComment(commentId, user);
  }
}
