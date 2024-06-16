const mockCommentsRepository = {
  save: jest.fn(),
  findCommentById: jest.fn(),
  findCommentsByPostId: jest.fn(),
  findCommentWithAuthorById: jest.fn(),
  findCommentWithChildById: jest.fn(),
  softDeleteCommentWithRelations: jest.fn(),
};

export default mockCommentsRepository;
