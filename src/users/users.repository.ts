import { CustomRepository } from 'src/database/custom-repository.decorator';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@CustomRepository(User)
export class UsersRepository extends Repository<User> {
  async findUserById(id: number): Promise<User | null> {
    return await this.findOneBy({ id });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return await this.findOneBy({ email });
  }
}
