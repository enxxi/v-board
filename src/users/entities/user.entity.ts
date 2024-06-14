import {
  AfterUpdate,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserRole } from 'src/common/enums/role.enum';
import { Post } from 'src/posts/entities/post.entity';
import { Comment } from 'src/comments/entities/comment.entity';
import { Exclude } from 'class-transformer';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  username: string;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ nullable: false })
  @Exclude()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    nullable: false,
    default: UserRole.User,
  })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @Column({ nullable: true })
  @Exclude()
  currentHashedRefreshToken?: string;

  @OneToMany(() => Post, (post) => post.author, { cascade: true })
  posts?: Post[];

  @OneToMany(() => Comment, (comment) => comment.author, { cascade: true })
  comments?: Comment[];

  private static dataSource: any;
  static setDataSource(dataSource) {
    User.dataSource = dataSource;
  }
  @AfterUpdate()
  async softDeleteRelatedEntities() {
    if (this.deletedAt) {
      const postRepository = User.dataSource.getRepository(Post);
      const commentRepository = User.dataSource.getRepository(Comment);

      const posts = await postRepository.find({
        where: { author: { id: this.id } },
      });
      for (const post of posts) {
        post.deletedAt = new Date();
        await postRepository.save(post);

        await commentRepository.softDelete({ post });
      }

      await commentRepository.softDelete({ author: { id: this.id } });
    }
  }
}
