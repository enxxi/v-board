import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UserRole } from 'src/common/enums/role.enum';
import { AuthController } from './auth.controller';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import mockedJwtService from 'src/common/mocks/jwt.service';
import mockedConfigService from 'src/common/mocks/config.service';
import { ForbiddenException } from '@nestjs/common';

describe('AdminController', () => {
  let authController: AuthController;
  let authService: AuthService;
  let usersService: UsersService;
  let adminUserData: User;
  let userData: User;

  beforeEach(async () => {
    adminUserData = {
      id: 1,
      email: 'admin@example.com',
      password: 'hashedPassword',
      username: 'adminuser',
      createdAt: new Date(),
      role: UserRole.ADMIN,
    };
    userData = {
      id: 2,
      email: 'test@example.com',
      password: 'hashedPassword',
      username: 'testuser',
      createdAt: new Date(),
      role: UserRole.User,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findUserByEmail: jest.fn(),
            findUserById: jest.fn(),
            saveUser: jest.fn(),
            setCurrentRefreshToken: jest.fn(),
            removeRefreshToken: jest.fn(),
          },
        },
        { provide: ConfigService, useValue: mockedConfigService },
        { provide: JwtService, useValue: mockedJwtService },
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: (context: any) => {
          const request = context.switchToHttp().getRequest();
          const user = request.user;
          if (user && user.role === UserRole.ADMIN) {
            return true;
          }
          throw new ForbiddenException('관리자 권한이 필요합니다.');
        },
      })
      .compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      };
      const result = { ...userData };
      jest.spyOn(authService, 'register').mockResolvedValue(result);

      expect(await authController.register(registerDto)).toEqual(result);
    });
  });

  describe('promoteToAdmin', () => {
    it('should call promoteToAdmin with correct userId', async () => {
      const userId = 2; //target user id
      const result = { ...userData, role: UserRole.ADMIN };

      jest.spyOn(authService, 'promoteToAdmin').mockResolvedValue(result);

      expect(await authController.promoteToAdmin({ id: userId })).toEqual(
        result,
      );
      expect(authService.promoteToAdmin).toHaveBeenCalledWith(userId);
    });

    it('should throw ForbiddenException if user is not admin', async () => {
      const userId = 2; //target user id

      jest.spyOn(authService, 'promoteToAdmin').mockImplementation(() => {
        throw new ForbiddenException('관리자 권한이 필요합니다.');
      });

      const request = {
        user: userData,
      };

      const context = { switchToHttp: () => ({ getRequest: () => request }) };

      await expect(
        authController.promoteToAdmin({ id: userId }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
