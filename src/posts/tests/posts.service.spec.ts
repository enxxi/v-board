import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from '../posts.service';
import { PostsRepository } from '../posts.repository';
import { FilesService } from 'src/files/files.service';
import { CategoriesService } from 'src/categories/categories.service';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { User } from 'src/users/entities/user.entity';
import { Category } from 'src/categories/category.entity';
import { CreatePostDto } from '../dto/createPost.dto';
import { UpdatePostDto } from '../dto/updatePost.dto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import PostNotFoundException from '../postNotFound.exception';
import { UserRole } from 'src/common/enums/role.enum';
import { CategoryType } from 'src/common/enums/category.enum';
import mockDataSource from 'src/common/mocks/datasource.mock';
import mockPostsRepository from './posts.repository.mock';

describe('PostsService', () => {
  let postsService: PostsService;
  let postsRepository: PostsRepository;
  let filesService: FilesService;
  let categoriesService: CategoriesService;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: PostsRepository,
          useValue: mockPostsRepository,
        },
        {
          provide: FilesService,
          useValue: {
            uploadPostFiles: jest.fn(),
            softDeleteFilesByPostId: jest.fn(),
          },
        },
        {
          provide: CategoriesService,
          useValue: {
            findCategoryById: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    postsService = module.get<PostsService>(PostsService);
    postsRepository = module.get<PostsRepository>(PostsRepository);
    filesService = module.get<FilesService>(FilesService);
    categoriesService = module.get<CategoriesService>(CategoriesService);
    dataSource = module.get<DataSource>(DataSource);
    queryRunner = dataSource.createQueryRunner();
  });

  describe('createPost', () => {
    it('should create a new post and upload files', async () => {
      const createPostDto: CreatePostDto = {
        title: 'Test Post',
        content: 'Test Content',
        categoryId: 1,
      };
      const user: User = { id: 1, role: UserRole.User } as User;
      const files: Express.Multer.File[] = [];

      const category: Category = {
        id: 2,
        name: CategoryType.QNA,
      } as Category;

      const savedPost: Post = {
        id: 1,
        title: 'Test Post',
        content: 'Test Content',
        category,
        author: user,
      } as Post;

      jest
        .spyOn(categoriesService, 'findCategoryById')
        .mockResolvedValue(category);
      jest.spyOn(postsRepository, 'create').mockReturnValue(savedPost);
      jest.spyOn(queryRunner.manager, 'save').mockResolvedValue(savedPost);

      const result = await postsService.createPost(createPostDto, user, files);

      expect(categoriesService.findCategoryById).toHaveBeenCalledWith(
        createPostDto.categoryId,
      );
      expect(postsRepository.create).toHaveBeenCalledWith({
        ...createPostDto,
        category,
        author: user,
      });
      expect(queryRunner.manager.save).toHaveBeenCalledWith(savedPost);
      expect(result).toEqual(savedPost);
    });

    it('should throw ForbiddenException if the user is not an admin', async () => {
      const createPostDto: CreatePostDto = {
        title: 'Test Post',
        content: 'Test Content',
        categoryId: 1,
      };
      const user: User = { id: 1, role: UserRole.User } as User;
      const files: Express.Multer.File[] = [];

      const category: Category = {
        id: 1,
        name: CategoryType.NOTICE,
      } as Category;

      jest
        .spyOn(categoriesService, 'findCategoryById')
        .mockResolvedValue(category);

      await expect(
        postsService.createPost(createPostDto, user, files),
      ).rejects.toThrow(ForbiddenException);
      expect(categoriesService.findCategoryById).toHaveBeenCalledWith(
        createPostDto.categoryId,
      );
    });

    it('should create a notice post if user is admin', async () => {
      const createPostDto: CreatePostDto = {
        title: 'Test Post',
        content: 'Test Content',
        categoryId: 1,
      };
      const admin: User = { id: 1, role: UserRole.ADMIN } as User;
      const files: Express.Multer.File[] = [];

      const category: Category = {
        id: 1,
        name: CategoryType.NOTICE,
      } as Category;

      const savedPost: Post = {
        id: 1,
        title: 'Test Post',
        content: 'Test Content',
        category,
        author: admin,
      } as Post;

      jest
        .spyOn(categoriesService, 'findCategoryById')
        .mockResolvedValue(category);
      jest.spyOn(postsRepository, 'create').mockReturnValue(savedPost);
      jest.spyOn(queryRunner.manager, 'save').mockResolvedValue(savedPost);

      const result = await postsService.createPost(createPostDto, admin, files);

      expect(categoriesService.findCategoryById).toHaveBeenCalledWith(
        createPostDto.categoryId,
      );
      expect(postsRepository.create).toHaveBeenCalledWith({
        ...createPostDto,
        category,
        author: admin,
      });
      expect(queryRunner.manager.save).toHaveBeenCalledWith(savedPost);
      expect(result).toEqual(savedPost);
    });
  });

  describe('getPosts', () => {
    it('should return a list of posts', async () => {
      const posts: Post[] = [
        { id: 1, title: 'Post 1', content: 'Content 1' } as Post,
        { id: 2, title: 'Post 2', content: 'Content 2' } as Post,
      ];

      jest.spyOn(postsRepository, 'getPosts').mockResolvedValue(posts);

      const result = await postsService.getPosts('createdAt', 'week', 0, 10);

      expect(postsRepository.getPosts).toHaveBeenCalledWith(
        'createdAt',
        'week',
        0,
        10,
      );
      expect(result).toEqual(posts);
    });
  });

  describe('searchPosts', () => {
    it('should return a list of posts based on search criteria', async () => {
      const posts: Post[] = [
        { id: 1, title: 'Post 1', content: 'Content 1' } as Post,
        { id: 2, title: 'Post 2', content: 'Content 2' } as Post,
      ];

      jest.spyOn(postsRepository, 'getPosts').mockResolvedValue(posts);

      const result = await postsService.searchPosts(
        'keyword',
        'type',
        'createdAt',
        'week',
        0,
        10,
      );

      expect(postsRepository.getPosts).toHaveBeenCalledWith(
        'createdAt',
        'week',
        0,
        10,
        'keyword',
        'type',
      );
      expect(result).toEqual(posts);
    });
  });

  describe('getPostDetail', () => {
    it('should return the post detail', async () => {
      const postId = 1;
      const post: Post = {
        id: postId,
        title: 'Test Post',
        content: 'Test Content',
      } as Post;

      jest.spyOn(postsRepository, 'getPostDetail').mockResolvedValue(post);

      const result = await postsService.getPostDetail(postId);

      expect(postsRepository.getPostDetail).toHaveBeenCalledWith(postId);
      expect(postsRepository.increment).toHaveBeenCalledWith(
        { id: postId },
        'viewCount',
        1,
      );
      expect(result).toEqual(post);
    });

    it('should throw PostNotFoundException if post is not found', async () => {
      const postId = 1;

      jest.spyOn(postsRepository, 'getPostDetail').mockResolvedValue(null);

      await expect(postsService.getPostDetail(postId)).rejects.toThrow(
        PostNotFoundException,
      );
    });
  });

  describe('updatePost', () => {
    it('should update the post and upload new files', async () => {
      const postId = 1;
      const updatePostDto: UpdatePostDto = {
        title: 'Updated Title',
        content: 'Updated Content',
      };
      const user: User = { id: 1, role: UserRole.User } as User;
      const files: Express.Multer.File[] = [];

      const post: Post = {
        id: postId,
        title: 'Test Post',
        content: 'Test Content',
        author: user,
      } as Post;
      const updatedPost: Post = { ...post, ...updatePostDto };

      jest.spyOn(postsService, 'getPostDetail').mockResolvedValue(post);
      jest.spyOn(queryRunner.manager, 'save').mockResolvedValue(updatedPost);

      const result = await postsService.updatePost(
        postId,
        updatePostDto,
        user,
        files,
      );

      expect(postsService.getPostDetail).toHaveBeenCalledWith(postId);
      expect(queryRunner.manager.save).toHaveBeenCalledWith(updatedPost);
      expect(result).toEqual(updatedPost);
    });
  });

  describe('deletePost', () => {
    it('should delete the post and related files', async () => {
      const postId = 1;
      const user: User = { id: 1, role: UserRole.User } as User;
      const post: Post = { id: postId, author: user } as Post;

      jest.spyOn(postsService, 'getPostDetail').mockResolvedValue(post);
      jest
        .spyOn(postsRepository, 'softDeletePostWithRelations')
        .mockResolvedValue(undefined);

      await postsService.deletePost(postId, user);

      expect(postsService.getPostDetail).toHaveBeenCalledWith(postId);
      expect(postsRepository.softDeletePostWithRelations).toHaveBeenCalledWith(
        queryRunner,
        postId,
      );
    });
  });
});
