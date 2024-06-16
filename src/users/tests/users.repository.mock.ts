const mockUsersRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findUserById: jest.fn(),
  findUserByEmail: jest.fn(),
  update: jest.fn(),
  softDeleteUserWithRelations: jest.fn(),
};

export default mockUsersRepository;
