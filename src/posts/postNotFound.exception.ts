import { NotFoundException } from '@nestjs/common';

class PostNotFoundException extends NotFoundException {
  constructor(postId: number) {
    super(`해당 id의 글을 찾을 수 없습니다.`);
  }
}

export default PostNotFoundException;
