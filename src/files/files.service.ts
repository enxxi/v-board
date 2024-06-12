import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { v4 as uuidv4 } from 'uuid';
import { InjectRepository } from '@nestjs/typeorm';
import { PublicFile } from './publicFile.entity';
import { QueryRunner, Repository } from 'typeorm';
import { Post } from 'src/posts/entities/post.entity';

@Injectable()
export class FilesService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(PublicFile)
    private filesRepository: Repository<PublicFile>,
  ) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
      },
    });
    this.bucketName = this.configService.get<string>('AWS_BUCKET_NAME');
  }

  async uploadPostFiles(
    files: Express.Multer.File[],
    post: Post,
    queryRunner: QueryRunner,
  ) {
    const uploadPromises = files.map((file) => this.uploadFile(file, 'post'));
    const imageUrls = await Promise.all(uploadPromises);

    const fileEntities = imageUrls.map((url) => {
      return this.filesRepository.create({ url, post });
    });

    return queryRunner.manager.save(fileEntities);
  }

  private async uploadFile(file: Express.Multer.File, data: string) {
    const key = `image/${data}/${uuidv4()}-${file.originalname}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    try {
      await this.s3Client.send(command);

      return `https://${this.bucketName}.s3.${this.configService.get<string>('AWS_REGION')}.amazonaws.com/image/${data}/${key}`;
    } catch (error) {
      throw new InternalServerErrorException('파일 업로드에 실패했습니다.');
    }
  }

  async deleteFile(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      await this.s3Client.send(command);
    } catch (error) {
      throw new InternalServerErrorException('파일 삭제에 실패했습니다.');
    }
  }

  async softDeleteFilesByPostId(postId: number, queryRunner?: QueryRunner) {
    const conditions = { post: { id: postId } };
    if (queryRunner) {
      await queryRunner.manager.softDelete(PublicFile, conditions);
    } else {
      await this.filesRepository.softDelete(conditions);
    }
  }
}
