import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { TypeOrmExModule } from 'src/database/custorm-repository.module';
import { PostsRepository } from './posts.repository';
import { CategoriesModule } from 'src/categories/categories.module';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([PostsRepository]),
    CategoriesModule,
  ],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
