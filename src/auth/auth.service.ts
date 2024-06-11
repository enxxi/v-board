import { HttpException, HttpStatus, Injectable, Req } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { UsersRepository } from 'src/users/users.repository';
import { MysqlErrorCode } from 'src/database/MysqlErrorCodes.enum';
import JwtPayload from './interface/payload.interface';
import { plainToClass } from 'class-transformer';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly userRepository: UsersRepository,
  ) {}

  async register(input: RegisterDto) {
    const hashedPassword = await bcrypt.hash(
      input.password,
      parseInt(this.configService.get('BCRYPT_SALT')),
    );
    try {
      const createdUser = await this.usersService.create({
        ...input,
        password: hashedPassword,
      });
      return createdUser;
    } catch (error) {
      if (error?.errno === MysqlErrorCode.DuplicateEntry) {
        throw new HttpException(
          '이미 존재하는 이메일입니다.',
          HttpStatus.CONFLICT,
        );
      }
      throw new HttpException(
        '회원가입에 실패하였습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async generateAccessToken(userId: number) {
    const payload: JwtPayload = { userId };
    const secret = this.configService.get('JWT_ACCESS_TOKEN_SECRET');
    const expiresIn = this.configService.get(
      'JWT_ACCESS_TOKEN_EXPIRATION_TIME',
    );

    return this.jwtService.sign(payload, {
      secret,
      expiresIn: `${expiresIn}s`,
    });
  }

  async generateRefreshToken(userId: number) {
    const payload: JwtPayload = { userId };
    const secret = this.configService.get('JWT_REFRESH_TOKEN_SECRET');
    const expiresIn = this.configService.get(
      'JWT_REFRESH_TOKEN_EXPIRATION_TIME',
    );
    const token = this.jwtService.sign(payload, {
      secret,
      expiresIn: `${expiresIn}s`,
    });
    const cookie = `Refresh=${token}; HttpOnly; Path=/; Max-Age=${expiresIn};`;
    return { cookie, token };
  }

  async getAuthenticatedUser(email: string, password: string) {
    try {
      const user = await this.usersService.findUserByEmail(email);
      await this.verifyPassword(password, user.password);
      return plainToClass(User, user);
    } catch (error) {
      throw new HttpException(
        '이메일 혹은 비밀번호가 잘못되었습니다.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async verifyPassword(plainPassword, hashedPassword) {
    const isMatching = await bcrypt.compare(plainPassword, hashedPassword);
    if (!isMatching) {
      throw new HttpException(
        '이메일 혹은 비밀번호가 잘못되었습니다.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  getCookieForLogOut() {
    return ['Refresh=; HttpOnly; Path=/; Max-Age=0'];
  }
}
