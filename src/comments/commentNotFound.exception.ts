import { NotFoundException } from '@nestjs/common';

class CommentNotFoundException extends NotFoundException {
  constructor(commentId: number) {
    super(`해당 id의 댓글을 찾을 수 없습니다.`);
  }
}

export default CommentNotFoundException;
