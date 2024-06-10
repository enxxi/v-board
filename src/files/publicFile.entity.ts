import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  DeleteDateColumn,
} from 'typeorm';
import { Post } from 'src/posts/entities/post.entity';

@Entity()
export class PublicFile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  url: string;

  @DeleteDateColumn()
  deletedAt?: Date;

  @ManyToOne(() => Post, (post) => post.files)
  post: Post;
}
