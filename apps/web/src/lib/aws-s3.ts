import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

/**
 * Minimal S3 photo uploader.
 *
 * Env vars:
 *   AWS_S3_BUCKET   (required — the bucket to upload to)
 *   AWS_S3_REGION   (default: AWS_REGION or us-west-2)
 *   AWS_REGION      (fallback)
 *
 * Standard AWS SDK credential resolution applies (env vars, shared profile,
 * IAM role).
 */

let cachedClient: S3Client | null = null;

function getClient(): S3Client {
  if (cachedClient) return cachedClient;
  const region = process.env.AWS_S3_REGION || process.env.AWS_REGION || 'us-west-2';
  cachedClient = new S3Client({ region });
  return cachedClient;
}

function getBucket(): string {
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) throw new Error('AWS_S3_BUCKET not configured');
  return bucket;
}

export function isS3Configured(): boolean {
  return Boolean(process.env.AWS_S3_BUCKET);
}

export type UploadResult = {
  bucket: string;
  key: string;
  region: string;
};

export async function uploadPhoto(
  bytes: Buffer,
  contentType: string,
  prefix = 'nameplates'
): Promise<UploadResult> {
  const bucket = getBucket();
  const region = process.env.AWS_S3_REGION || process.env.AWS_REGION || 'us-west-2';
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `local-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const ext = contentType.split('/')[1]?.split(';')[0] || 'jpg';
  const key = `${prefix}/${id}.${ext}`;

  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: bytes,
      ContentType: contentType,
    })
  );

  return { bucket, key, region };
}
