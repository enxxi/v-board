import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmExModule } from 'src/database/custorm-repository.module';
import { UsersRepository } from './users.repository';
import { PassportModule } from '@nestjs/passport';
import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmExModule.forCustomRepository([UsersRepository]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [TypeOrmExModule, UsersService],
})
export class UsersModule {
  constructor(private dataSource: DataSource) {
    User.setDataSource(dataSource);
  }
}
