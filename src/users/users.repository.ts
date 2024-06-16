import { CustomRepository } from 'src/database/custom-repository.decorator';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@CustomRepository(User)
export class UsersRepository extends Repository<User> {
  async findUserById(id: number): Promise<User | null> {
    return await this.findOneBy({ id });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return await this.findOneBy({ email });
  }

  async softDeleteUserWithRelations(queryRunner: any, userId: number) {
    await queryRunner.manager.softDelete(User, userId);

    await queryRunner.query(
      `
      UPDATE post SET deletedAt = NOW() WHERE authorId = ?
    `,
      [userId],
    );

    await queryRunner.query(
      `
      UPDATE comment SET deletedAt = NOW() WHERE authorId = ?
    `,
      [userId],
    );

    const postIds = (
      await queryRunner.query(
        `
      SELECT id FROM post WHERE authorId = ?
    `,
        [userId],
      )
    ).map((post: any) => post.id);

    if (postIds.length > 0) {
      await queryRunner.query(
        `
        UPDATE comment SET deletedAt = NOW() WHERE postId IN (?)
      `,
        [postIds],
      );

      await queryRunner.query(
        `
        UPDATE public_file SET deletedAt = NOW() WHERE postId IN (?)
      `,
        [postIds],
      );
    }

    const commentIds = (
      await queryRunner.query(
        `
      SELECT id FROM comment WHERE authorId = ?
    `,
        [userId],
      )
    ).map((comment: any) => comment.id);

    if (commentIds.length > 0) {
      await queryRunner.query(
        `
        UPDATE comment SET deletedAt = NOW() WHERE parentCommentId IN (?)
      `,
        [commentIds],
      );
    }
  }
}
