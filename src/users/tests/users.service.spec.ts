import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users.service';
import { UsersRepository } from '../users.repository';
import { ConfigService } from '@nestjs/config';
import { DataSource, QueryRunner } from 'typeorm';
import mockUsersRepository from './users.repository.mock';
import mockDataSource from 'src/common/mocks/datasource.mock';
import { User } from '../entities/user.entity';
import { RegisterDto } from 'src/auth/dto/register.dto';
import UserNotFoundException from '../userNotFound.exception';
import { NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { plainToClass } from 'class-transformer';

describe('UsersService', () => {
  let usersService: UsersService;
  let usersRepository: UsersRepository;
  let configService: ConfigService;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: mockUsersRepository },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    usersRepository = module.get<UsersRepository>(UsersRepository);
    configService = module.get<ConfigService>(ConfigService);
    dataSource = module.get<DataSource>(DataSource);
    queryRunner = dataSource.createQueryRunner();
  });

  it('should be defined', () => {
    expect(usersService).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password',
      };
      const newUser: User = {
        id: 1,
        email: registerDto.email,
        username: registerDto.username,
        password: registerDto.password,
      } as User;

      jest.spyOn(usersRepository, 'create').mockReturnValue(newUser);
      jest.spyOn(usersRepository, 'save').mockResolvedValue(newUser);

      const result = await usersService.create(registerDto);

      expect(usersRepository.create).toHaveBeenCalledWith(registerDto);
      expect(usersRepository.save).toHaveBeenCalledWith(newUser);
      expect(result).toEqual(newUser);
    });
  });

  describe('getUsers', () => {
    it('should return a list of users', async () => {
      const users: User[] = [
        {
          id: 1,
          email: 'test1@example.com',
          username: 'user1',
          password: 'password1',
        } as User,
        {
          id: 2,
          email: 'test2@example.com',
          username: 'user2',
          password: 'password2',
        } as User,
      ];

      jest.spyOn(usersRepository, 'find').mockResolvedValue(users);

      const result = await usersService.getUsers();

      expect(usersRepository.find).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });

  describe('findUserById', () => {
    it('should return the user if found', async () => {
      const userId = 1;
      const user: User = {
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        password: 'password',
      } as User;

      jest.spyOn(usersRepository, 'findUserById').mockResolvedValue(user);

      const result = await usersService.findUserById(userId);

      expect(usersRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(plainToClass(User, user));
    });

    it('should throw UserNotFoundException if user is not found', async () => {
      const userId = 1;

      jest.spyOn(usersRepository, 'findUserById').mockResolvedValue(null);

      await expect(usersService.findUserById(userId)).rejects.toThrow(
        UserNotFoundException,
      );
    });
  });

  describe('findUserByEmail', () => {
    it('should return the user if found', async () => {
      const email = 'test@example.com';
      const user: User = {
        id: 1,
        email,
        username: 'testuser',
        password: 'password',
      } as User;

      jest.spyOn(usersRepository, 'findUserByEmail').mockResolvedValue(user);

      const result = await usersService.findUserByEmail(email);

      expect(usersRepository.findUserByEmail).toHaveBeenCalledWith(email);
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException if user is not found', async () => {
      const email = 'test@example.com';

      jest.spyOn(usersRepository, 'findUserByEmail').mockResolvedValue(null);

      await expect(usersService.findUserByEmail(email)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUserIfRefreshTokenMatches', () => {
    it('should return the user if refresh token matches', async () => {
      const refreshToken = 'someRefreshToken';
      const userId = 1;
      const user: User = {
        id: userId,
        currentHashedRefreshToken: 'hashedRefreshToken',
      } as User;

      jest.spyOn(usersRepository, 'findUserById').mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const result = await usersService.getUserIfRefreshTokenMatches(
        refreshToken,
        userId,
      );

      expect(usersRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        refreshToken,
        user.currentHashedRefreshToken,
      );
      expect(result).toEqual(plainToClass(User, user));
    });

    it('should return null if refresh token does not match', async () => {
      const refreshToken = 'someRefreshToken';
      const userId = 1;
      const user: User = {
        id: userId,
        currentHashedRefreshToken: 'hashedRefreshToken',
      } as User;

      jest.spyOn(usersRepository, 'findUserById').mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      const result = await usersService.getUserIfRefreshTokenMatches(
        refreshToken,
        userId,
      );

      expect(usersRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        refreshToken,
        user.currentHashedRefreshToken,
      );
      expect(result).toBeNull();
    });
  });

  describe('setCurrentRefreshToken', () => {
    it('should set the current refresh token', async () => {
      const refreshToken = 'someRefreshToken';
      const userId = 1;
      const hashedRefreshToken = 'hashedRefreshToken';

      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedRefreshToken);
      jest.spyOn(configService, 'get').mockReturnValue('10');
      jest.spyOn(usersRepository, 'update').mockResolvedValue({} as any);

      await usersService.setCurrentRefreshToken(refreshToken, userId);

      expect(bcrypt.hash).toHaveBeenCalledWith(refreshToken, 10);
      expect(usersRepository.update).toHaveBeenCalledWith(userId, {
        currentHashedRefreshToken: hashedRefreshToken,
      });
    });
  });

  describe('removeRefreshToken', () => {
    it('should remove the current refresh token', async () => {
      const userId = 1;

      jest.spyOn(usersRepository, 'update').mockResolvedValue({} as any);

      await usersService.removeRefreshToken(userId);

      expect(usersRepository.update).toHaveBeenCalledWith(userId, {
        currentHashedRefreshToken: null,
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete the user and related entities', async () => {
      const userId = 1;

      jest
        .spyOn(usersRepository, 'softDeleteUserWithRelations')
        .mockResolvedValue(undefined);

      await usersService.deleteUser(userId);

      expect(usersRepository.softDeleteUserWithRelations).toHaveBeenCalledWith(
        queryRunner,
        userId,
      );
    });
  });
});
