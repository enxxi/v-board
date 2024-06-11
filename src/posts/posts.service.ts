import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/createPost.dto';
import { User } from 'src/users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { PostsRepository } from './posts.repository';
import { CategoriesService } from 'src/categories/categories.service';
import { NotFoundError } from 'rxjs';
import PostNotFoundException from './postNotFound.exception';
import { UpdatePostDto } from './dto/updatePost.dto';

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

  async updatePost(id: number, post: UpdatePostDto) {
    const updatedPost = await this.postsRepository.update(id, post);
    if (!updatedPost.affected) {
      throw new PostNotFoundException(id);
    }
  }

  async deletePost(id: number) {
    const deletedPost = await this.postsRepository.softDelete({ id });
    if (!deletedPost.affected) {
      throw new PostNotFoundException(id);
    }
  }
}
