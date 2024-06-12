import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { TypeOrmExModule } from 'src/database/custorm-repository.module';
import { PostsRepository } from 'src/posts/posts.repository';
import { CommentsRepository } from './comments.repository';
import { PostsModule } from 'src/posts/posts.module';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([PostsRepository, CommentsRepository]),
    PostsModule,
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
