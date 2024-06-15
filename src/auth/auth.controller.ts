import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  ClassSerializerInterceptor,
  Req,
  Res,
  UseGuards,
  HttpCode,
  Patch,
  Param,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';
import RequestWithUser from './interface/requestWithUser.interface';
import { Response, response } from 'express';
import { LocalAuthGuard } from './guards/local-auth.guard';
import JwtAuthGuard from './guards/jwt-auth.guard';
import JwtRefreshGuard from './guards/jwt-refresh.guard';
import FindOneParams from 'src/common/findOneParams';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/role.enum';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: '회원가입' })
  async register(@Body() input: RegisterDto) {
    const user = await this.authService.register(input);
    return user;
  }

  @HttpCode(200)
  @UseGuards(LocalAuthGuard)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        password: { type: 'string', example: 'aa1234' },
      },
    },
  })
  @ApiOperation({ summary: '로그인' })
  @Post('login')
  async login(@Req() request: RequestWithUser, @Res() response: Response) {
    const { user } = request;
    const accessToken = await this.authService.generateAccessToken(user.id);
    const { cookie: refreshTokenCookie, token: refreshToken } =
      await this.authService.generateRefreshToken(user.id);

    await this.usersService.setCurrentRefreshToken(refreshToken, user.id);

    response.setHeader('Set-Cookie', refreshTokenCookie);
    response.send({ accessToken });
  }

  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('accessToken')
  @ApiOperation({ summary: '로그아웃' })
  @Post('logout')
  async logOut(@Req() request: RequestWithUser, @Res() response: Response) {
    await this.usersService.removeRefreshToken(request.user.id);
    response.setHeader('Set-Cookie', this.authService.getCookieForLogOut());
    response.sendStatus(200);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @ApiOperation({ summary: 'access token 재발급' })
  async restoreAccessToken(
    @Req() request: RequestWithUser,
    @Res() response: Response,
  ) {
    const accessToken = await this.authService.generateAccessToken(
      request.user.id,
    );
    response.send({ accessToken });
  }

  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('accessToken')
  @ApiOperation({
    summary: '관리자 권한 부여',
    description: '관리자(admin)만 가능합니다.',
  })
  @Patch('promote/:id')
  async promoteToAdmin(@Param() { id }: FindOneParams) {
    return await this.authService.promoteToAdmin(+id);
  }
}
