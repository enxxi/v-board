import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AppService {
  getHello(): string {
    const filePath = path.join(__dirname, '..', '..', 'views', 'view.html');
    return fs.readFileSync(filePath, 'utf8');
  }
}
