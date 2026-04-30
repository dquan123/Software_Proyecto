const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const R2_BUCKET = process.env.R2_BUCKET;
const R2_ENDPOINT = process.env.R2_ENDPOINT;

const r2Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
  },
});

function sanitizeFilename(filename) {
  return filename.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
}

function buildObjectKey(originalname) {
  return `${Date.now()}-${sanitizeFilename(originalname)}`;
}

function buildFileUrl(key) {
  return `${R2_ENDPOINT.replace(/\/+$/, "")}/${R2_BUCKET}/${key}`;
}

async function uploadBufferToR2(file) {
  const key = buildObjectKey(file.originalname);

  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  return {
    key,
    url: buildFileUrl(key),
  };
}

async function deleteObjectFromR2(key) {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    })
  );
}

module.exports = {
  r2Client,
  uploadBufferToR2,
  deleteObjectFromR2,
};
