import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { Category } from 'src/categories/category.entity';
import { CategoryType } from 'src/common/enums/category.enum';

export default class CategorySeeder implements Seeder {
  public async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<any> {
    const repository = dataSource.getRepository(Category);
    await repository.insert([
      {
        name: CategoryType.NOTICE,
      },
      { name: CategoryType.QNA },
      { name: CategoryType.INQUIRY },
    ]);
  }
}
