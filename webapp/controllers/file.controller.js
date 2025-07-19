const {
  uploadFile,
  getFileMetadata,
  deleteFile,
} = require("../service/fileService");
const AWS = require("aws-sdk");
const logger = require("../config/logger"); // Use CloudWatch logging

const cloudwatch = new AWS.CloudWatch({
  region: process.env.AWS_REGION || "us-east-2",
});

const uploadFileController = async (req, res) => {
  const startTime = Date.now();
  logger.info("Inside uploadFileController - file upload request received");

  try {
    const file = req.file;
    if (!file) {
      logger.warn("No file provided in request");
      return res.status(400).json();
    }

    const result = await uploadFile(file);
    logger.info(`File uploaded successfully: ${result.fileUrl}`);

    // Log API execution time in CloudWatch
    await cloudwatch
      .putMetricData({
        Namespace: "WebApp/APIUsage",
        MetricData: [
          {
            MetricName: "UploadFileAPICallCount",
            Dimensions: [{ Name: "API", Value: "/file/upload" }],
            Value: 1,
            Unit: "Count",
          },
          {
            MetricName: "UploadFileAPIDuration",
            Dimensions: [{ Name: "API", Value: "/file/upload" }],
            Value: Date.now() - startTime,
            Unit: "Milliseconds",
          },
        ],
      })
      .promise();

    return res.status(201).json(result);
  } catch (error) {
    logger.error("Error uploading file", { error });
    return res
      .status(500)
      .json({ message: "Error uploading file", error: error.message });
  }
};

const getFileController = async (req, res) => {
  const startTime = Date.now();
  logger.info("Inside getFileController - file metadata request received");

  try {
    const { id } = req.params;
    const result = await getFileMetadata(id);
    logger.info(`File metadata retrieved successfully for ID: ${id}`);

    // Log API execution time in CloudWatch
    await cloudwatch
      .putMetricData({
        Namespace: "WebApp/APIUsage",
        MetricData: [
          {
            MetricName: "GetFileAPICallCount",
            Dimensions: [{ Name: "API", Value: "/file/:id" }],
            Value: 1,
            Unit: "Count",
          },
          {
            MetricName: "GetFileAPIDuration",
            Dimensions: [{ Name: "API", Value: "/file/:id" }],
            Value: Date.now() - startTime,
            Unit: "Milliseconds",
          },
        ],
      })
      .promise();

    return res.status(200).json(result);
  } catch (error) {
    logger.error(`Error retrieving file metadata for ID: ${req.params.id}`, {
      error,
    });
    return res.status(404).end();
  }
};

const deleteFileController = async (req, res) => {
  const startTime = Date.now();
  logger.info("Inside deleteFileController - file deletion request received");

  try {
    const { id } = req.params;
    await deleteFile(id);
    logger.info(`File deleted successfully: ${id}`);

    // Log API execution time in CloudWatch
    await cloudwatch
      .putMetricData({
        Namespace: "WebApp/APIUsage",
        MetricData: [
          {
            MetricName: "DeleteFileAPICallCount",
            Dimensions: [{ Name: "API", Value: "/file/:id" }],
            Value: 1,
            Unit: "Count",
          },
          {
            MetricName: "DeleteFileAPIDuration",
            Dimensions: [{ Name: "API", Value: "/file/:id" }],
            Value: Date.now() - startTime,
            Unit: "Milliseconds",
          },
        ],
      })
      .promise();

    return res.status(204).json();
  } catch (error) {
    logger.error(`Error deleting file: ${req.params.id}`, { error });
    return res.status(404).end();
  }
};

module.exports = {
  uploadFileController,
  getFileController,
  deleteFileController,
};
