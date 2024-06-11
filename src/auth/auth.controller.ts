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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';
import RequestWithUser from './interface/requestWithUser.interface';
import { Response, response } from 'express';
import { LocalAuthenticationGuard } from './localAuthentication.guard';
import JwtAuthGuard from './jwt-auth.guard';
import JwtRefreshGuard from './jwt-refresh.guard';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  async register(@Body() input: RegisterDto) {
    const user = await this.authService.register(input);
    return user;
  }

  @HttpCode(200)
  @UseGuards(LocalAuthenticationGuard)
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
  @Post('logout')
  async logOut(@Req() request: RequestWithUser, @Res() response: Response) {
    await this.usersService.removeRefreshToken(request.user.id);
    response.setHeader('Set-Cookie', this.authService.getCookieForLogOut());
    response.sendStatus(200);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async restoreAccessToken(
    @Req() request: RequestWithUser,
    @Res() response: Response,
  ) {
    const accessToken = await this.authService.generateAccessToken(
      request.user.id,
    );
    response.send({ accessToken });
  }
}
