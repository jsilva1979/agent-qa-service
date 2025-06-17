import { Storage } from '@google-cloud/storage';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.GCS_PROJECT_ID || !process.env.GCS_KEY_FILE_PATH || !process.env.GCS_BUCKET_NAME) {
  throw new Error('Missing Google Cloud Storage environment variables');
}

export const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  keyFilename: process.env.GCS_KEY_FILE_PATH,
});

export const bucketName = process.env.GCS_BUCKET_NAME; 