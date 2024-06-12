import { ForbiddenException, Injectable } from '@nestjs/common';
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

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostsRepository) private postsRepository: PostsRepository,
    private readonly categoriesService: CategoriesService,
  ) {}

  async createPost(post: CreatePostDto, user: User) {
    const category = await this.categoriesService.findCategoryById(
      post.categoryId,
    );

    this.checkAdminPermission(category.name, user.role);

    const newPost = await this.postsRepository.create({
      ...post,
      category: category,
      author: user,
    });

    return await this.postsRepository.save(newPost);
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

  async updatePost(id: number, data: UpdatePostDto, user: User) {
    const post = await this.getPostDetail(id);
    this.checkAdminOrAuthorPermission(post, user);
    return await this.postsRepository.update(id, data);
  }

  async deletePost(id: number, user: User) {
    const post = await this.getPostDetail(id);
    this.checkAdminOrAuthorPermission(post, user);

    return await this.postsRepository.softDelete({ id });
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
}
