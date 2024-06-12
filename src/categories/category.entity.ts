import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Post } from '../posts/entities/post.entity';
import { CategoryType } from 'src/common/enums/category.enum';

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: CategoryType,
    nullable: false,
  })
  name: CategoryType;

  @OneToMany(() => Post, (post) => post.category)
  posts: Post[];
}
