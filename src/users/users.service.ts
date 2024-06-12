import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersRepository } from './users.repository';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { plainToClass } from 'class-transformer';
import UserNotFoundException from './userNotFound.exception';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UsersRepository) private usersRepository: UsersRepository,
    private readonly configService: ConfigService,
  ) {}
  async create(userData: RegisterDto) {
    const newUser = await this.usersRepository.create(userData);
    await this.usersRepository.save(newUser);
    return newUser;
  }

  async findUserById(id: number) {
    const user = await this.usersRepository.findUserById(id);
    if (user) {
      return plainToClass(User, user);
    }
    throw new UserNotFoundException(id);
  }

  async findUserByEmail(email: string) {
    const user = await this.usersRepository.findUserByEmail(email);
    if (user) {
      return user;
    }
    throw new HttpException(
      '해당 이메일의 유저가 없습니다.',
      HttpStatus.NOT_FOUND,
    );
  }

  async getUserIfRefreshTokenMatches(refreshToken: string, userId: number) {
    const user: User = await this.usersRepository.findUserById(userId);
    if (!user.currentHashedRefreshToken) {
      return null;
    }

    const isRefreshTokenMatching = await bcrypt.compare(
      refreshToken,
      user.currentHashedRefreshToken,
    );

    if (isRefreshTokenMatching) {
      return plainToClass(User, user);
    }
  }

  async setCurrentRefreshToken(refreshToken: string, userId: number) {
    const currentHashedRefreshToken = await bcrypt.hash(
      refreshToken,
      parseInt(this.configService.get('BCRYPT_SALT')),
    );
    await this.usersRepository.update(userId, { currentHashedRefreshToken });
  }

  async removeRefreshToken(userId: number) {
    return this.usersRepository.update(userId, {
      currentHashedRefreshToken: null,
    });
  }

  async saveUser(user: User) {
    return this.usersRepository.save(user);
  }
}
