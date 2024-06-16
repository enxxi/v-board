import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { Repository } from 'typeorm';
import { Category } from './category.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

describe('CategoriesService', () => {
  let categoriesService: CategoriesService;
  let repository: Repository<Category>;

  const mockCategoryRepository = {
    find: jest.fn(),
    findOneBy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoryRepository,
        },
      ],
    }).compile();

    categoriesService = module.get<CategoriesService>(CategoriesService);
    repository = module.get<Repository<Category>>(getRepositoryToken(Category));
  });

  it('should be defined', () => {
    expect(categoriesService).toBeDefined();
  });

  describe('getAllCategories', () => {
    it('should reutrn an array of categories', async () => {
      const result = [
        { id: 1, name: 'notice' },
        { id: 2, name: 'qna' },
        { id: 3, name: 'inquiry' },
      ];

      mockCategoryRepository.find.mockResolvedValue(result);
      expect(await categoriesService.getAllCategories()).toBe(result);
    });
  });

  describe('findCategoryId', () => {
    it('should return a category if found', async () => {
      const categoryId = 1;
      const result = { id: 1, name: 'notice' };
      mockCategoryRepository.findOneBy.mockResolvedValue(result);

      expect(await categoriesService.findCategoryById(categoryId)).toBe(result);
    });

    it('should throw an NotFoundException if category is not found', async () => {
      const categoryId = 1;
      mockCategoryRepository.findOneBy.mockResolvedValue(null);

      await expect(
        categoriesService.findCategoryById(categoryId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
