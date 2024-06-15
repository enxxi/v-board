import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
import { PaginationParams } from 'src/common/paginationParams';
import { SortParams } from 'src/common/sortParams';
import { SearchParams } from 'src/common/searchParams';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('posts')
@Controller('posts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('accessToken')
@UseInterceptors(ClassSerializerInterceptor)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiOperation({ summary: '게시글 생성' })
  @ApiConsumes('multipart/form-data')
  async createPost(
    @Body() post: CreatePostDto,
    @UploadedFiles() files: Express.Multer.File[],
    @GetUser() user: User,
  ) {
    return await this.postsService.createPost(post, user, files);
  }

  @Get()
  @ApiOperation({ summary: '모든 게시글 조회' })
  async getPosts(
    @Query() { sortBy, duration }: SortParams,
    @Query() { offset, limit }: PaginationParams,
  ) {
    return await this.postsService.getPosts(sortBy, duration, offset, limit);
  }

  @Get('search')
  @ApiOperation({ summary: '게시글 검색' })
  async searchPosts(
    @Query() { keyword, type }: SearchParams,
    @Query() { sortBy, duration }: SortParams,
    @Query() { offset, limit }: PaginationParams,
  ) {
    return await this.postsService.searchPosts(
      keyword,
      type,
      sortBy,
      duration,
      offset,
      limit,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '게시글 개별 조회' })
  async getPostDetail(@Param() { id }: FindOneParams) {
    return await this.postsService.getPostDetail(+id);
  }

  @Patch(':id')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiOperation({ summary: '게시글 수정' })
  @ApiConsumes('multipart/form-data')
  async updatePost(
    @Param() { id }: FindOneParams,
    @Body() post: UpdatePostDto,
    @UploadedFiles() files: Express.Multer.File[],
    @GetUser() user: User,
  ) {
    return this.postsService.updatePost(+id, post, user, files);
  }

  @Delete(':id')
  @ApiOperation({ summary: '게시글 삭제' })
  async deletePost(@Param() { id }: FindOneParams, @GetUser() user: User) {
    return this.postsService.deletePost(+id, user);
  }
}
