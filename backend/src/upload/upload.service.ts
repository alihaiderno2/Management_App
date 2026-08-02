import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private s3Client = new S3Client({
    region: 'us-east-1', 
    endpoint: 'http://localhost:9000', 
    forcePathStyle: true, 
    credentials: {
      accessKeyId: 'minio_admin', 
      secretAccessKey: 'minio_password',
    },
  });

  async generatePresignedUrl(fileName: string, fileType: string) {
    const uniqueKey = `${uuidv4()}-${fileName}`;
    const bucketName = 'chat-uploads'; 

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: uniqueKey,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 60 });

    const fileUrl = `http://localhost:9000/${bucketName}/${uniqueKey}`;

    return { uploadUrl, fileUrl, fileName, fileType };
  }
}