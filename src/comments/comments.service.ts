import { ForbiddenException, Injectable } from '@nestjs/common';
import { CommentsRepository } from './comments.repository';
import { CreateCommentDto } from './dto/createComment.dto';
import { PostsRepository } from 'src/posts/posts.repository';
import { User } from 'src/users/entities/user.entity';
import PostNotFoundException from 'src/posts/postNotFound.exception';
import { Comment } from './entities/comment.entity';
import CommentNotFoundException from './commentNotFound.exception';
import { UpdateCommentDto } from './dto/updateComment.dto';
import { UserRole } from 'src/common/enums/role.enum';

@Injectable()
export class CommentsService {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly postsRepository: PostsRepository,
  ) {}

  async createComment(postId: number, comment: CreateCommentDto, author: User) {
    const { content, parentCommentId } = comment;

    const post = await this.postsRepository.getPostDetail(postId);
    if (!post) {
      throw new PostNotFoundException(postId);
    }

    const newComment = new Comment();
    newComment.content = content;
    newComment.post = post;
    newComment.author = author;

    if (parentCommentId) {
      const parentComment =
        await this.commentsRepository.findCommentById(parentCommentId);
      if (!parentComment) {
        throw new CommentNotFoundException(parentCommentId);
      }
      newComment.parentComment = parentComment;
      newComment.depth = parentComment.depth + 1;
    } else {
      newComment.depth = 0;
    }

    return this.commentsRepository.save(newComment);
  }

  async getCommentsByPostId(postId: number) {
    return this.commentsRepository.findCommentsByPostId(postId);
  }

  async updateComment(id: number, data: UpdateCommentDto, user: User) {
    const { content } = data;

    const comment = await this.commentsRepository.findCommentWithAuthorById(id);
    if (!comment) {
      throw new CommentNotFoundException(id);
    }

    this.checkAdminOrAuthorPermission(comment, user);

    comment.content = content;
    return this.commentsRepository.save(comment);
  }

  async deleteComment(id: number, user: User) {
    const comment = await this.commentsRepository.findCommentWithChildById(id);
    if (!comment) {
      throw new CommentNotFoundException(id);
    }

    this.checkAdminOrAuthorPermission(comment, user);

    await this.softDeleteRecursive(comment);
  }

  private checkAdminOrAuthorPermission(comment: Comment, user: User) {
    if (comment.author.id !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('권한이 없습니다.');
    }
  }

  private async softDeleteRecursive(comment: Comment): Promise<void> {
    const childComments = await this.commentsRepository
      .createQueryBuilder('comment')
      .where('comment.parentCommentId = :parentCommentId', {
        parentCommentId: comment.id,
      })
      .getMany();

    for (const child of childComments) {
      await this.softDeleteRecursive(child);
    }

    await this.commentsRepository.softDelete({ id: comment.id } as Comment);
  }
}
