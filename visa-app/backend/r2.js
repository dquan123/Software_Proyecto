const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const R2_BUCKET = process.env.R2_BUCKET;
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY;
const R2_SECRET_KEY = process.env.R2_SECRET_KEY;

const r2Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY,
  },
});

function getMissingR2EnvVars() {
  return [
    ["R2_ACCESS_KEY", R2_ACCESS_KEY],
    ["R2_SECRET_KEY", R2_SECRET_KEY],
    ["R2_BUCKET", R2_BUCKET],
    ["R2_ENDPOINT", R2_ENDPOINT],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);
}

function validateR2Config() {
  const missingVars = getMissingR2EnvVars();

  if (missingVars.length > 0) {
    throw new Error(`Missing R2 environment variables: ${missingVars.join(", ")}`);
  }

  if (
    R2_ENDPOINT.includes("your-account-id") ||
    R2_BUCKET.includes("your_r2_bucket") ||
    R2_ACCESS_KEY.includes("your_r2_access_key") ||
    R2_SECRET_KEY.includes("your_r2_secret_key")
  ) {
    throw new Error("R2 environment variables contain placeholder values");
  }
}

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
  validateR2Config();
  const key = buildObjectKey(file.originalname);

  console.log(`Uploading file to R2... key=${key}`);

  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  console.log(`R2 upload success key=${key}`);

  return {
    key,
    url: buildFileUrl(key),
  };
}

async function deleteObjectFromR2(key) {
  validateR2Config();
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    })
  );
}

module.exports = {
  r2Client,
  validateR2Config,
  uploadBufferToR2,
  deleteObjectFromR2,
};
