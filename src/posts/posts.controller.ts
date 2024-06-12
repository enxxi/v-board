import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/createPost.dto';
import JwtAuthGuard from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';
import FindOneParams from 'src/common/findOneParams';
import { UpdatePostDto } from './dto/updatePost.dto';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('posts')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files', 10))
  async createPost(
    @Body() post: CreatePostDto,
    @UploadedFiles() files: Express.Multer.File[],
    @GetUser() user: User,
  ) {
    return await this.postsService.createPost(post, user, files);
  }

  @Get()
  async getPosts() {
    return await this.postsService.getPosts();
  }

  @Get(':id')
  async getPostDetail(@Param() { id }: FindOneParams) {
    return await this.postsService.getPostDetail(+id);
  }

  @Patch(':id')
  @UseInterceptors(FilesInterceptor('files', 10))
  async updatePost(
    @Param() { id }: FindOneParams,
    @Body() post: UpdatePostDto,
    @UploadedFiles() files: Express.Multer.File[],
    @GetUser() user: User,
  ) {
    return this.postsService.updatePost(+id, post, user, files);
  }

  @Delete(':id')
  async deletePost(@Param() { id }: FindOneParams, @GetUser() user: User) {
    return this.postsService.deletePost(+id, user);
  }
}
