import { CustomRepository } from 'src/database/custom-repository.decorator';
import { Post } from './entities/post.entity';
import { Repository } from 'typeorm';

@CustomRepository(Post)
export class PostsRepository extends Repository<Post> {
  async getPosts(
    sortBy?: string,
    duration?: string,
    offset?: number,
    limit?: number,
    keyword?: string,
    type?: string,
  ) {
    let query = this.buildJoinQuery();

    if (keyword) {
      query = this.applySearchFilter(query, keyword, type);
    }

    query = this.applySort(query, sortBy);
    query = this.applyDateFilter(query, duration);
    query = this.applyPagination(query, offset, limit);
    return query.getMany();
  }

  async getPostDetail(id: number) {
    return await this.findOne({
      where: { id },
      relations: { author: true, category: true },
    });
  }

  private calculateDate(duration: string) {
    const now = new Date();
    switch (duration) {
      case 'week':
        now.setDate(now.getDate() - 7);
        break;
      case 'month':
        now.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        now.setFullYear(now.getFullYear() - 1);
        break;
    }
    return now;
  }

  private buildJoinQuery() {
    return this.createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.category', 'category');
  }

  private applySort(query, sortBy?: string) {
    if (sortBy === 'views') {
      return (query = query.orderBy('post.viewCount', 'DESC'));
    } else {
      return (query = query.orderBy('post.createdAt', 'DESC'));
    }
  }

  private applyDateFilter(query, duration?: string) {
    if (duration) {
      const date = this.calculateDate(duration);
      return (query = query.andWhere('post.createdAt > :date', { date }));
    }
    return query;
  }

  private applyPagination(query, offset?: number, limit?: number) {
    if (!limit && offset) {
      limit = 10;
    }
    return query.take(limit).skip(offset);
  }

  private applySearchFilter(query, keyword: string, type?: string) {
    if (type === 'title') {
      return query.where('post.title LIKE :keyword', {
        keyword: `%${keyword}%`,
      });
    } else if (type === 'author') {
      return query.where('author.username LIKE :keyword', {
        keyword: `%${keyword}%`,
      });
    } else {
      return query.where(
        'post.title LIKE :keyword OR author.username LIKE :keyword',
        { keyword: `%${keyword}%` },
      );
    }
  }
}
