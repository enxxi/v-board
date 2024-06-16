import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { FilesService } from './files.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { S3Client } from '@aws-sdk/client-s3';
import { PublicFile } from './publicFile.entity';
import { Post } from 'src/posts/entities/post.entity';
import { QueryRunner } from 'typeorm';
import mockUpdateResult from 'src/common/mocks/update-result.mock';

jest.mock('@aws-sdk/client-s3');

describe('FilesService', () => {
  let filesService: FilesService;
  let filesRepository: Repository<PublicFile>;
  let configService: ConfigService;
  let s3Client: S3Client;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                AWS_REGION: 'ap-northeast-2',
                AWS_ACCESS_KEY_ID: 'test-access-key',
                AWS_SECRET_ACCESS_KEY: 'test-secret-key',
                AWS_BUCKET_NAME: 'test-bucket',
              };
              return config[key];
            }),
          },
        },
        {
          provide: getRepositoryToken(PublicFile),
          useClass: Repository,
        },
      ],
    }).compile();

    filesService = module.get<FilesService>(FilesService);
    filesRepository = module.get<Repository<PublicFile>>(
      getRepositoryToken(PublicFile),
    );
    configService = module.get<ConfigService>(ConfigService);
    s3Client = new S3Client({});

    jest.clearAllMocks();
  });

  describe('uploadPostFiles', () => {
    it('should upload files and save file entities', async () => {
      const files: Express.Multer.File[] = [
        {
          originalname: 'test1.png',
          buffer: Buffer.from('file1'),
          mimetype: 'image/png',
        } as Express.Multer.File,
        {
          originalname: 'test2.png',
          buffer: Buffer.from('file2'),
          mimetype: 'image/png',
        } as Express.Multer.File,
      ];

      const post: Post = { id: 1, title: 'Post', content: 'Content' } as Post;
      const queryRunner = {
        manager: {
          save: jest.fn(),
        },
      } as unknown as QueryRunner;

      jest
        .spyOn(filesService as any, 'uploadFile')
        .mockResolvedValue('http://test-url');
      jest.spyOn(queryRunner.manager, 'save').mockResolvedValue([]);
      jest.spyOn(filesRepository, 'create').mockImplementation((file) => {
        return { ...file, id: 1 } as PublicFile;
      });

      const result = await filesService.uploadPostFiles(
        files,
        post,
        queryRunner,
      );

      expect(filesService['uploadFile']).toHaveBeenCalledTimes(files.length);
      expect(queryRunner.manager.save).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('softDeleteFilesByPostId', () => {
    it('should soft delete files associated with a post using queryRunner', async () => {
      const postId = 1;
      const queryRunner = {
        manager: { softDelete: jest.fn() },
      } as unknown as QueryRunner;

      await filesService.softDeleteFilesByPostId(postId, queryRunner);

      expect(queryRunner.manager.softDelete).toHaveBeenCalledWith(PublicFile, {
        post: { id: postId },
      });
    });

    it('should soft delete files associated with a post using repository', async () => {
      const postId = 1;
      jest
        .spyOn(filesRepository, 'softDelete')
        .mockResolvedValue(mockUpdateResult);

      await filesService.softDeleteFilesByPostId(postId);

      expect(filesRepository.softDelete).toHaveBeenCalledWith({
        post: { id: postId },
      });
    });
  });
});
