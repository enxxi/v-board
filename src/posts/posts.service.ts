import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreatePostDto } from './dto/createPost.dto';
import { User } from 'src/users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { PostsRepository } from './posts.repository';
import { CategoriesService } from 'src/categories/categories.service';
import PostNotFoundException from './postNotFound.exception';
import { UpdatePostDto } from './dto/updatePost.dto';
import { UserRole } from 'src/common/enums/role.enum';
import { CategoryType } from 'src/common/enums/category.enum';
import { Post } from './entities/post.entity';
import { DataSource } from 'typeorm';
import { FilesService } from 'src/files/files.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostsRepository) private postsRepository: PostsRepository,
    private readonly filesService: FilesService,
    private readonly categoriesService: CategoriesService,
    private readonly dataSource: DataSource,
  ) {}

  async createPost(
    post: CreatePostDto,
    user: User,
    files: Express.Multer.File[],
  ) {
    return this.executeInTransaction(async (queryRunner) => {
      const category = await this.categoriesService.findCategoryById(
        post.categoryId,
      );

      this.checkAdminPermission(category.name, user.role);

      const newPost = this.postsRepository.create({
        ...post,
        category: category,
        author: user,
      });

      const savedPost = await queryRunner.manager.save(newPost);

      if (files && files.length > 0) {
        const fileEntities = await this.filesService.uploadPostFiles(
          files,
          savedPost,
          queryRunner,
        );
        savedPost.files = fileEntities;
      }
      return savedPost;
    });
  }

  async getPosts() {
    return this.postsRepository.getPosts();
  }

  async getPostDetail(id: number) {
    const post = await this.postsRepository.getPostDetail(id);
    if (!post) {
      throw new PostNotFoundException(id);
    }
    return post;
  }

  async updatePost(
    id: number,
    data: UpdatePostDto,
    user: User,
    files?: Express.Multer.File[],
  ) {
    return this.executeInTransaction(async (queryRunner) => {
      const post = await this.getPostDetail(id);
      this.checkAdminOrAuthorPermission(post, user);

      Object.assign(post, data);
      const updatedPost = await queryRunner.manager.save(post);

      if (files && files.length > 0) {
        await this.filesService.softDeleteFilesByPostId(id, queryRunner);
        const fileEntities = await this.filesService.uploadPostFiles(
          files,
          updatedPost,
          queryRunner,
        );

        updatedPost.files = fileEntities;
      }
      return updatedPost;
    });
  }

  async deletePost(id: number, user: User) {
    const post = await this.getPostDetail(id);
    this.checkAdminOrAuthorPermission(post, user);

    await this.postsRepository.softDelete({ id });
    await this.filesService.softDeleteFilesByPostId(id);
  }

  private checkAdminPermission(category: string, role: string) {
    if (category === CategoryType.NOTICE && role !== UserRole.ADMIN) {
      throw new ForbiddenException('관리자 권한이 필요합니다.');
    }
  }

  private checkAdminOrAuthorPermission(post: Post, user: User) {
    if (post.author.id !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('게시글 삭제 권한이 없습니다.');
    }
  }

  private async executeInTransaction<T>(
    operation: (queryRunner) => Promise<T>,
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await operation(queryRunner);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        '트랜잭션 처리 중 오류가 발생했습니다.',
      );
    } finally {
      await queryRunner.release();
    }
  }
}
