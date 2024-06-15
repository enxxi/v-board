const mockedConfigService = {
  get(key: string) {
    switch (key) {
      case 'JWT_ACCESS_TOKEN_EXPIRATION_TIME':
        return '3600';
      case 'BCRYPT_SALT':
        return '10';
    }
  },
};

export default mockedConfigService;
