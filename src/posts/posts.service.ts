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

    if (category.name === CategoryType.NOTICE && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('관리자 권한이 필요합니다.');
    }

    const newPost = await this.postsRepository.create({
      ...post,
      category: category,
      author: user,
    });

    await this.postsRepository.save(newPost);
    return newPost;
  }

  async getPosts() {
    return this.postsRepository.getPosts();
  }

  async getPostDetail(id: number) {
    const post = await this.postsRepository.getPostDetail(id);
    if (post) {
      return post;
    }
    throw new PostNotFoundException(id);
  }

  async updatePost(id: number, data: UpdatePostDto, user: User) {
    const post = await this.getPostDetail(id);
    if (
      post.category.name === CategoryType.NOTICE &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('관리자 권한이 필요합니다.');
    }

    return await this.postsRepository.update(id, data);
  }

  async deletePost(id: number, user: User) {
    const post = await this.getPostDetail(id);
    if (
      post.category.name === CategoryType.NOTICE &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('관리자 권한이 필요합니다.');
    }
    return await this.postsRepository.softDelete({ id });
  }
}
