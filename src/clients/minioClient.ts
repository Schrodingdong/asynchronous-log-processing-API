import 'dotenv/config'
import * as Minio from 'minio'

export const LOG_BUCKET = 'logs';

const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT!,
    port: Number(process.env.MINIO_PORT),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY!,
    secretKey: process.env.MINIO_SECRET_KEY!,
})

export async function initializeObjectStorage() {
  if (!await minioClient.bucketExists(LOG_BUCKET)) {
    console.log(`Bucket ${LOG_BUCKET} doesn't exist. Creating...`);
    await minioClient.makeBucket(LOG_BUCKET);
  }
}

export default minioClient;
