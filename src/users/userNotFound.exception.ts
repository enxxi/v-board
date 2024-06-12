import { NotFoundException } from '@nestjs/common';

class UserNotFoundException extends NotFoundException {
  constructor(userId: number) {
    super(`해당 id의 유저을 찾을 수 없습니다.`);
  }
}

export default UserNotFoundException;
