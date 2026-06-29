import { NextRequest } from 'next/server';
import { isS3Configured, uploadPhoto } from '@/lib/aws-s3';

/**
 * POST /api/home-documents
 *
 * Uploads a single photo to S3 under the `documents/` prefix and returns
 * the S3 key + bucket. The browser keeps a thumbnail in localStorage so the
 * /my-home thumbnail strip works without exposing the S3 bucket publicly.
 *
 * Body: FormData with a single `photo` File field.
 */
export async function POST(request: NextRequest) {
  if (!isS3Configured()) {
    return Response.json(
      { error: 'AWS_S3_BUCKET not configured on the server' },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const photo = formData.get('photo');
  if (!(photo instanceof File)) {
    return Response.json({ error: "Missing 'photo' field" }, { status: 400 });
  }

  const isImage = photo.type.startsWith('image/');
  const isPdf = photo.type === 'application/pdf';
  if (!isImage && !isPdf) {
    return Response.json(
      { error: `Unsupported content type: ${photo.type}. Images and PDFs only.` },
      { status: 415 }
    );
  }

  // Soft cap to keep S3 bills predictable for a demo (~8 MB per file).
  const MAX_BYTES = 8 * 1024 * 1024;
  if (photo.size > MAX_BYTES) {
    return Response.json(
      { error: 'Photo is larger than 8 MB' },
      { status: 413 }
    );
  }

  try {
    const buffer = Buffer.from(await photo.arrayBuffer());
    const result = await uploadPhoto(buffer, photo.type, 'documents');
    return Response.json({
      key: result.key,
      bucket: result.bucket,
      region: result.region,
    });
  } catch (err) {
    console.error('[/api/home-documents upload failed]', err);
    return Response.json({ error: 'Upload to S3 failed' }, { status: 502 });
  }
}
