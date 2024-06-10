import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesService } from './files.service';
import { PublicFile } from './publicFile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PublicFile])],
  //   controllers: [PostsController],
  providers: [FilesService],
})
export class FilesModule {}
