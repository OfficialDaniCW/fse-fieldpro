import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { setCors, handleOptions } from './_lib/db.js';
import { randomUUID } from 'crypto';

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { filename, contentType } = req.body || {};
  if (!filename) return res.status(400).json({ error: 'filename is required' });

  const key = `uploads/${randomUUID()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType || 'application/octet-stream',
    });

    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });

    res.json({ uploadUrl, fileUrl: publicUrl, key });
  } catch (err) {
    console.error('Upload URL error:', err);
    res.status(500).json({ error: err.message });
  }
}
