import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CategoriesService {
  @InjectRepository(Category)
  private categoriesRepository: Repository<Category>;

  async getAllCategories() {
    return await this.categoriesRepository.find({ order: { id: 'ASC' } });
  }

  async findCategoryById(id: number) {
    const category = await this.categoriesRepository.findOneBy({ id });
    if (category) {
      return category;
    }
    throw new HttpException(
      '해당 id의 카테고리가 없습니다.',
      HttpStatus.NOT_FOUND,
    );
  }
}
