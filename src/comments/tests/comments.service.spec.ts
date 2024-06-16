import { Test, TestingModule } from '@nestjs/testing';
import { CommentsService } from '../comments.service';
import { CommentsRepository } from '../comments.repository';
import { PostsRepository } from 'src/posts/posts.repository';
import { DataSource, QueryRunner } from 'typeorm';
import { CreateCommentDto } from '../dto/createComment.dto';
import { UserRole } from 'src/common/enums/role.enum';
import { User } from 'src/users/entities/user.entity';
import { Post } from 'src/posts/entities/post.entity';
import { CategoryType } from 'src/common/enums/category.enum';
import { Comment } from '../entities/comment.entity';
import PostNotFoundException from 'src/posts/postNotFound.exception';
import mockDataSource from '../../common/mocks/datasource.mock';
import mockPostsRepository from '../../posts/tests/posts.repository.mock';
import mockCommentsRepository from './mocks/comments.repository.mock';
import { UpdateCommentDto } from '../dto/updateComment.dto';
import CommentNotFoundException from '../commentNotFound.exception';
import { ForbiddenException } from '@nestjs/common';

describe('CommentsService', () => {
  let commentsService: CommentsService;
  let commentsRepository: CommentsRepository;
  let postsRepository: PostsRepository;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;
  let userData: User;
  let mockPost: Post;

  beforeEach(async () => {
    userData = {
      id: 1,
      email: 'test@example.com',
      password: 'hashedPassword',
      username: 'testuser',
      createdAt: new Date(),
      role: UserRole.User,
    };

    mockPost = {
      id: 1,
      title: 'Test Post',
      content: 'Test Content',
      viewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      author: userData,
      category: { id: 2, name: CategoryType.QNA, posts: [] },
      comments: [],
      files: [],
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: CommentsRepository, useValue: mockCommentsRepository },
        { provide: PostsRepository, useValue: mockPostsRepository },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    commentsService = module.get<CommentsService>(CommentsService);
    commentsRepository = module.get<CommentsRepository>(CommentsRepository);
    postsRepository = module.get<PostsRepository>(PostsRepository);
    dataSource = module.get<DataSource>(DataSource);
    queryRunner = dataSource.createQueryRunner();
  });

  it('should be defined', () => {
    expect(commentsService).toBeDefined();
  });

  describe('createComment', () => {
    it('should create a new comment', async () => {
      const postId = 1;
      const createCommentDto: CreateCommentDto = {
        content: 'Test comment',
        parentCommentId: null,
      };
      const author: User = { id: 1, username: 'user1' } as User;
      const post: Post = {
        id: 1,
        title: 'Post 1',
        content: 'Post content',
      } as Post;

      jest.spyOn(postsRepository, 'getPostDetail').mockResolvedValue(post);
      jest.spyOn(commentsRepository, 'save').mockResolvedValue({} as Comment);

      const result = await commentsService.createComment(
        postId,
        createCommentDto,
        author,
      );

      expect(postsRepository.getPostDetail).toHaveBeenCalledWith(postId);
      expect(commentsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Test comment',
          post,
          author,
          depth: 0,
        }),
      );
      expect(result).toEqual({});
    });

    it('should throw PostNotFoundException if post is not found', async () => {
      const postId = 1;
      const createCommentDto: CreateCommentDto = {
        content: 'Test comment',
        parentCommentId: null,
      };

      mockPostsRepository.getPostDetail.mockResolvedValue(null);

      await expect(
        commentsService.createComment(postId, createCommentDto, userData),
      ).rejects.toThrow(PostNotFoundException);
    });
  });

  describe('getCommentsByPostId', () => {
    it('should return comments for a given postId', async () => {
      const postId = 1;
      const comments = [
        { id: 1, content: 'Comment 1', post: { id: postId } },
        { id: 2, content: 'Comment 2', post: { id: postId } },
      ] as Comment[];

      jest
        .spyOn(commentsRepository, 'findCommentsByPostId')
        .mockResolvedValue(comments);

      const result = await commentsService.getCommentsByPostId(postId);

      expect(commentsRepository.findCommentsByPostId).toHaveBeenCalledWith(
        postId,
      );
      expect(result).toEqual(comments);
    });
  });

  describe('updateComment', () => {
    it('should update a comment', async () => {
      const commentId = 1;
      const updateCommentDto: UpdateCommentDto = { content: 'Updated Content' };
      const user: User = { id: 1, role: UserRole.User } as User;
      const comment: Comment = {
        id: commentId,
        content: 'Old content',
        author: user,
      } as Comment;

      jest
        .spyOn(commentsRepository, 'findCommentWithAuthorById')
        .mockResolvedValue(comment);
      jest.spyOn(commentsRepository, 'save').mockResolvedValue(comment);

      const result = await commentsService.updateComment(
        commentId,
        updateCommentDto,
        user,
      );

      expect(commentsRepository.findCommentWithAuthorById).toHaveBeenCalledWith(
        commentId,
      );
      expect(comment.content).toBe('Updated Content');
      expect(commentsRepository.save).toHaveBeenCalledWith(comment);
      expect(result).toEqual(comment);
    });

    it('should throw CommentNotFoundException if comment does not exist', async () => {
      const commentId = 1;
      const updateCommentDto: UpdateCommentDto = { content: 'Updated Content' };
      const user: User = { id: 1, role: UserRole.User } as User;

      jest
        .spyOn(commentsRepository, 'findCommentWithAuthorById')
        .mockResolvedValue(null);

      await expect(
        commentsService.updateComment(commentId, updateCommentDto, user),
      ).rejects.toThrow(CommentNotFoundException);

      expect(commentsRepository.findCommentWithAuthorById).toHaveBeenCalledWith(
        commentId,
      );
    });

    it('should throw ForbiddenException if user is not the author or an admin', async () => {
      const commentId = 1;
      const updateCommentDto: UpdateCommentDto = { content: 'Updated content' };
      const user: User = { id: 2, role: UserRole.User } as User;
      const author: User = { id: 1, role: UserRole.User } as User;
      const comment: Comment = {
        id: commentId,
        content: 'Old content',
        author,
      } as Comment;

      jest
        .spyOn(commentsRepository, 'findCommentWithAuthorById')
        .mockResolvedValue(comment);

      await expect(
        commentsService.updateComment(commentId, updateCommentDto, user),
      ).rejects.toThrow(ForbiddenException);

      expect(commentsRepository.findCommentWithAuthorById).toHaveBeenCalledWith(
        commentId,
      );
    });

    it('should update the comment if user is an admin', async () => {
      const commentId = 1;
      const updateCommentDto: UpdateCommentDto = { content: 'Updated Content' };
      const user: User = { id: 2, role: UserRole.ADMIN } as User;
      const author: User = { id: 1, role: UserRole.User } as User;
      const comment: Comment = {
        id: commentId,
        content: 'Old content',
        author,
      } as Comment;

      jest
        .spyOn(commentsRepository, 'findCommentWithAuthorById')
        .mockResolvedValue(comment);
      jest.spyOn(commentsRepository, 'save').mockResolvedValue(comment);

      const result = await commentsService.updateComment(
        commentId,
        updateCommentDto,
        user,
      );

      expect(commentsRepository.findCommentWithAuthorById).toHaveBeenCalledWith(
        commentId,
      );
      expect(comment.content).toBe('Updated Content');
      expect(commentsRepository.save).toHaveBeenCalledWith(comment);
      expect(result).toEqual(comment);
    });

    it('should update the comment if user is an admin', async () => {
      const commentId = 1;
      const updateCommentDto: UpdateCommentDto = { content: 'Updated Content' };
      const user: User = { id: 2, role: UserRole.ADMIN } as User;
      const author: User = { id: 1, role: UserRole.User } as User;
      const comment: Comment = {
        id: commentId,
        content: 'Old content',
        author,
      } as Comment;

      jest
        .spyOn(commentsRepository, 'findCommentWithAuthorById')
        .mockResolvedValue(comment);
      jest.spyOn(commentsRepository, 'save').mockResolvedValue(comment);

      const result = await commentsService.updateComment(
        commentId,
        updateCommentDto,
        user,
      );

      expect(commentsRepository.findCommentWithAuthorById).toHaveBeenCalledWith(
        commentId,
      );
      expect(comment.content).toBe('Updated Content');
      expect(commentsRepository.save).toHaveBeenCalledWith(comment);
      expect(result).toEqual(comment);
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment if the user is the author or an admin', async () => {
      const commentId = 1;
      const user: User = { id: 1, role: UserRole.User } as User;
      const comment: Comment = { id: commentId, author: user } as Comment;
      const queryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
      };

      jest
        .spyOn(commentsRepository, 'findCommentWithChildById')
        .mockResolvedValue(comment);
      jest
        .spyOn(dataSource, 'createQueryRunner')
        .mockReturnValue(queryRunner as any);
      jest
        .spyOn(commentsRepository, 'softDeleteCommentWithRelations')
        .mockResolvedValue(undefined);

      await commentsService.deleteComment(commentId, user);

      expect(commentsRepository.findCommentWithChildById).toHaveBeenCalledWith(
        commentId,
      );
      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(
        commentsRepository.softDeleteCommentWithRelations,
      ).toHaveBeenCalledWith(queryRunner, commentId);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should throw CommentNotFoundException if comment does not exist', async () => {
      const commentId = 1;
      const user: User = { id: 1, role: UserRole.User } as User;

      jest
        .spyOn(commentsRepository, 'findCommentWithChildById')
        .mockResolvedValue(null);

      await expect(
        commentsService.deleteComment(commentId, user),
      ).rejects.toThrow(CommentNotFoundException);

      expect(commentsRepository.findCommentWithChildById).toHaveBeenCalledWith(
        commentId,
      );
    });

    it('should throw ForbiddenException if user is not the author', async () => {
      const commentId = 1;
      const user: User = { id: 2, role: UserRole.User } as User;
      const author: User = { id: 1, role: UserRole.User } as User;
      const comment: Comment = { id: commentId, author } as Comment;

      jest
        .spyOn(commentsRepository, 'findCommentWithChildById')
        .mockResolvedValue(comment);

      await expect(
        commentsService.deleteComment(commentId, user),
      ).rejects.toThrow(ForbiddenException);

      expect(commentsRepository.findCommentWithChildById).toHaveBeenCalledWith(
        commentId,
      );
    });
    it('should delete the comment if user is an admin', async () => {
      const commentId = 1;
      const user: User = { id: 2, role: UserRole.ADMIN } as User;
      const author: User = { id: 1, role: UserRole.User } as User;
      const comment: Comment = { id: commentId, author } as Comment;
      const queryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
      };

      jest
        .spyOn(commentsRepository, 'findCommentWithChildById')
        .mockResolvedValue(comment);
      jest
        .spyOn(dataSource, 'createQueryRunner')
        .mockReturnValue(queryRunner as any);
      jest
        .spyOn(commentsRepository, 'softDeleteCommentWithRelations')
        .mockResolvedValue(undefined);

      await commentsService.deleteComment(commentId, user);

      expect(commentsRepository.findCommentWithChildById).toHaveBeenCalledWith(
        commentId,
      );
      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(
        commentsRepository.softDeleteCommentWithRelations,
      ).toHaveBeenCalledWith(queryRunner, commentId);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });

  it('should delete the comment if user is the author', async () => {
    const commentId = 1;
    const user: User = { id: 1, role: UserRole.User } as User;
    const comment: Comment = { id: commentId, author: user } as Comment;
    const queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
    };

    jest
      .spyOn(commentsRepository, 'findCommentWithChildById')
      .mockResolvedValue(comment);
    jest
      .spyOn(dataSource, 'createQueryRunner')
      .mockReturnValue(queryRunner as any);
    jest
      .spyOn(commentsRepository, 'softDeleteCommentWithRelations')
      .mockResolvedValue(undefined);

    await commentsService.deleteComment(commentId, user);

    expect(commentsRepository.findCommentWithChildById).toHaveBeenCalledWith(
      commentId,
    );
    expect(queryRunner.connect).toHaveBeenCalled();
    expect(queryRunner.startTransaction).toHaveBeenCalled();
    expect(
      commentsRepository.softDeleteCommentWithRelations,
    ).toHaveBeenCalledWith(queryRunner, commentId);
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
  });
});
