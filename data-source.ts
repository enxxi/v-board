import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();
const configService = new ConfigService();

export default new DataSource({
  type: 'mysql',
  database: configService.get<string>('DB_DATABASE'),
  username: configService.get<string>('DB_USERNAME'),
  password: configService.get<string>('DB_PASSWORD'),
  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  synchronize: false,
});
