const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const fs = require('fs');

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || process.env.R2_PUBLIC_URL || 'http://localhost:9000',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true, // required for MinIO and R2
});

const BUCKET = process.env.R2_BUCKET_NAME || 'codeatlas-repos';

/**
 * Upload a local file to S3/MinIO.
 * @param {string} localPath - absolute path to the file on disk
 * @param {string} s3Key - destination key inside the bucket
 * @returns {Promise<string>} the S3 key
 */
async function uploadFileToS3(localPath, s3Key) {
  const stream = fs.createReadStream(localPath);
  const upload = new Upload({
    client: s3,
    params: {
      Bucket: BUCKET,
      Key: s3Key,
      Body: stream,
    },
  });
  await upload.done();
  return s3Key;
}

/**
 * Upload a Buffer or string directly (no local file needed).
 * @param {Buffer|string} body
 * @param {string} s3Key
 * @param {string} [contentType='text/plain']
 */
async function uploadBufferToS3(body, s3Key, contentType = 'text/plain') {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: s3Key,
    Body: body,
    ContentType: contentType,
  }));
  return s3Key;
}

/**
 * Get a file's content from S3 as a string.
 * @param {string} s3Key
 * @returns {Promise<string>}
 */
async function getFileFromS3(s3Key) {
  const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: s3Key }));
  const chunks = [];
  for await (const chunk of res.Body) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

/**
 * List all keys under a given prefix.
 * @param {string} prefix
 * @returns {Promise<string[]>}
 */
async function listFilesInPrefix(prefix) {
  const keys = [];
  let continuationToken;
  do {
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    }));
    for (const obj of res.Contents || []) {
      keys.push(obj.Key);
    }
    continuationToken = res.IsTruncated ? res.NextContinuationToken : null;
  } while (continuationToken);
  return keys;
}

/**
 * Delete all objects under a given prefix (wipes a repo's files).
 * @param {string} prefix
 */
async function deletePrefix(prefix) {
  const keys = await listFilesInPrefix(prefix);
  for (const key of keys) {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  }
}

module.exports = { s3, uploadFileToS3, uploadBufferToS3, getFileFromS3, listFilesInPrefix, deletePrefix };
