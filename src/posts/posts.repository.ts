import { CustomRepository } from 'src/database/custom-repository.decorator';
import { Post } from './entities/post.entity';
import { Repository } from 'typeorm';

@CustomRepository(Post)
export class PostsRepository extends Repository<Post> {
  async getPosts() {
    return await this.find({ relations: { author: true, category: true } });
  }

  async getPostDetail(id: number) {
    return await this.findOne({
      where: { id },
      relations: { author: true, category: true },
    });
  }
}
