const mockPostsRepository = {
  getPostDetail: jest.fn(),
  create: jest.fn(),
  softDeletePostWithRelations: jest.fn(),
  increment: jest.fn(),
  save: jest.fn(),
  getPosts: jest.fn(),
};

export default mockPostsRepository;
