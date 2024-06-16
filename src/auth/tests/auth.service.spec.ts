import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import mockedConfigService from 'src/common/mocks/config.service';
import mockedJwtService from 'src/common/mocks/jwt.service';
import { RegisterDto } from '../dto/register.dto';
import * as bcrypt from 'bcrypt';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { MysqlErrorCode } from 'src/database/MysqlErrorCodes.enum';
import { User } from 'src/users/entities/user.entity';
import { UserRole } from 'src/common/enums/role.enum';
import { plainToClass } from 'class-transformer';

jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let userData: User;

  beforeEach(async () => {
    userData = {
      id: 1,
      email: 'test@example.com',
      password: 'hashedPassword',
      username: 'testuser',
      createdAt: new Date(),
      role: UserRole.User,
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findUserByEmail: jest.fn(),
            findUserById: jest.fn(),
            saveUser: jest.fn(),
          },
        },
        { provide: ConfigService, useValue: mockedConfigService },
        { provide: JwtService, useValue: mockedJwtService },
      ],
    }).compile();

    authService = await module.get<AuthService>(AuthService);
    usersService = await module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const input: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      };

      const hashedPassword = 'hashedPassword';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const createdUser = { id: 1, ...input, password: hashedPassword };
      (usersService.create as jest.Mock).mockResolvedValue(createdUser);

      const result = await authService.register(input);

      expect(bcrypt.hash).toHaveBeenCalledWith(input.password, 10);
      expect(usersService.create).toHaveBeenCalledWith({
        ...input,
        password: hashedPassword,
      });
      expect(result).toEqual(createdUser);
    });

    it('should throw conflict exception if email already exists', async () => {
      const input: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (usersService.create as jest.Mock).mockRejectedValue({
        errno: MysqlErrorCode.DuplicateEntry,
      });

      await expect(authService.register(input)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('generateAccessToken', () => {
    it('should return a string', async () => {
      const userId = 1;
      const result = await authService.generateAccessToken(userId);
      expect(typeof result).toEqual('string');
    });
  });

  describe('generateRefreshToken', () => {
    it('should return an object', async () => {
      const userId = 1;
      const result = await authService.generateRefreshToken(userId);
      expect(typeof result).toEqual('object');
      expect(result).toHaveProperty('cookie');
      expect(result).toHaveProperty('token');
    });
  });

  describe('getAuthenticatedUser', () => {
    it('should return authenticated user', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      (usersService.findUserByEmail as jest.Mock).mockResolvedValue(userData);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.getAuthenticatedUser(email, password);

      expect(usersService.findUserByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, userData.password);

      expect(result).toEqual(plainToClass(User, userData));
    });
  });

  it('should throw BadRequestException for invalid email', async () => {
    const email = 'test1@example.com';
    const password = 'password123';

    (usersService.findUserByEmail as jest.Mock).mockResolvedValue(null);

    await expect(
      authService.getAuthenticatedUser(email, password),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException for invalid password', async () => {
    const email = 'test@example.com';
    const password = 'wrongpw123';

    (usersService.findUserByEmail as jest.Mock).mockResolvedValue(userData);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      authService.getAuthenticatedUser(email, password),
    ).rejects.toThrow(BadRequestException);
  });

  describe('promoteToAdmin', () => {
    it('should promote a user to admin', async () => {
      const userId = 1;
      const user = userData;
      user.id = userId;

      (usersService.findUserById as jest.Mock).mockResolvedValue(user);
      (usersService.saveUser as jest.Mock).mockResolvedValue({
        ...user,
        role: UserRole.ADMIN,
      });

      const result = await authService.promoteToAdmin(userId);

      expect(usersService.findUserById).toHaveBeenCalledWith(userId);
      expect(usersService.saveUser).toHaveBeenCalledWith({
        ...user,
        role: UserRole.ADMIN,
      });
      expect(result.role).toEqual(UserRole.ADMIN);
    });
  });
});
