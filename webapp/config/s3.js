const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const AWS = require("aws-sdk");
const logger = require("./logger");

const cloudwatch = new AWS.CloudWatch({
  region: process.env.AWS_REGION || "us-east-2",
});

const s3 = new S3Client({
  region: process.env.AWS_REGION, // AWS region
});

async function uploadFileToS3(bucket, key, body) {
  const startTime = Date.now();
  logger.info(`Uploading file to S3: Bucket=${bucket}, Key=${key}`);

  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
    });

    await s3.send(command);

    const duration = Date.now() - startTime;
    logger.info(`File uploaded successfully to S3 in ${duration}ms`);

    // Send S3 upload duration metric to CloudWatch
    await cloudwatch
      .putMetricData({
        Namespace: "WebApp/S3",
        MetricData: [
          {
            MetricName: "S3UploadDuration",
            Dimensions: [{ Name: "Bucket", Value: bucket }],
            Value: duration,
            Unit: "Milliseconds",
          },
        ],
      })
      .promise();
  } catch (error) {
    logger.error(`S3 Upload failed: Bucket=${bucket}, Key=${key}`, { error });
    throw error;
  }
}

module.exports = { s3, uploadFileToS3 };
