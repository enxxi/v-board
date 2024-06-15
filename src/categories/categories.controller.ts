import { Controller, Get, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @ApiTags('posts')
  @ApiOperation({ summary: '게시글 카테고리 목록 조회' })
  @Get()
  async getAllCategories() {
    return this.categoriesService.getAllCategories();
  }
}
