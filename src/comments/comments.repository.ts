import { CustomRepository } from 'src/database/custom-repository.decorator';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';

@CustomRepository(Comment)
export class CommentsRepository extends Repository<Comment> {
  async findCommentById(id: number) {
    return await this.findOneBy({ id });
  }

  async findCommentsByPostId(postId: number) {
    return await this.find({
      where: { post: { id: postId }, parentComment: null },
      relations: ['author', 'childComments', 'childComments.author'],
    });
  }

  async findCommentWithAuthorById(id: number) {
    return await this.findOne({
      where: { id },
      relations: ['author'],
    });
  }

  async findCommentWithChildById(id: number) {
    return await this.findOne({
      where: { id },
      relations: ['author', 'childComments'],
    });
  }

  async softDeleteCommentWithRelations(
    queryRunner: any,
    commentId: number,
  ): Promise<void> {
    await queryRunner.manager.softDelete(Comment, commentId);

    await queryRunner.query(
      `
      UPDATE comment SET deletedAt = NOW() WHERE parentCommentId = ?
    `,
      [commentId],
    );

    await this.updateParentComments(queryRunner, commentId);
  }

  async updateParentComments(
    queryRunner: any,
    parentId: number,
  ): Promise<void> {
    const comments = await queryRunner.query(
      `
      SELECT id FROM comment WHERE parentCommentId = ? AND deletedAt IS NULL
      `,
      [parentId],
    );

    for (const comment of comments) {
      await queryRunner.query(
        `
        UPDATE comment SET deletedAt = NOW() WHERE id = ?
      `,
        [comment.id],
      );
      // 재귀함수 호출
      await this.updateParentComments(queryRunner, comment.id);
    }
  }
}
