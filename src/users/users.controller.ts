import {
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import FindOneParams from 'src/common/findOneParams';
import JwtAuthGuard from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/role.enum';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth('accessToken')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: '모든 유저 조회',
    description: '관리자(admin)만 가능합니다.',
  })
  @Get()
  async getUsers() {
    return await this.usersService.getUsers();
  }

  @ApiOperation({
    summary: '유저 조회',
  })
  @Get(':id')
  async findOne(@Param() { id }: FindOneParams) {
    return await this.usersService.findUserById(+id);
  }

  @ApiOperation({
    summary: '유저 탈퇴',
  })
  @Delete(':id')
  async deleteUser(@Param() { id }: FindOneParams) {
    return await this.usersService.deleteUser(+id);
  }
}
