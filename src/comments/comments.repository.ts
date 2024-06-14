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
}
