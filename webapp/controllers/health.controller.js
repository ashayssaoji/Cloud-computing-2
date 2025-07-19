const db = require("../models");
const AWS = require("aws-sdk");
const logger = require("../config/logger");

const cloudwatch = new AWS.CloudWatch({
  region: process.env.AWS_REGION || "us-east-2",
});

exports.checkHealth = async (req, res) => {
  const startTime = Date.now();
  logger.info("Health check request received");

  if (
    req.url.includes("?") ||
    Object.keys(req.query).length > 0 ||
    req.headers["content-length"] > 0 ||
    (req.body && Object.keys(req.body).length > 0)
  ) {
    logger.warn("Invalid health check request with unexpected parameters");
    return res
      .status(400)
      .set({
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        "X-Content-Type-Options": "nosniff",
      })
      .send();
  }

  try {
    // Check database connection instead of inserting records
    await db.sequelize.authenticate();
    logger.info("Database connection is healthy");

    // Log API execution time in CloudWatch
    await cloudwatch
      .putMetricData({
        Namespace: "WebApp/APIUsage",
        MetricData: [
          {
            MetricName: "HealthCheckAPICallCount",
            Dimensions: [{ Name: "API", Value: "/health" }],
            Value: 1,
            Unit: "Count",
          },
          {
            MetricName: "HealthCheckAPIDuration",
            Dimensions: [{ Name: "API", Value: "/health" }],
            Value: Date.now() - startTime,
            Unit: "Milliseconds",
          },
        ],
      })
      .promise();

    res
      .status(200)
      .set({
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        "X-Content-Type-Options": "nosniff",
      })
      .send();
  } catch (err) {
    logger.error("Health check failed", { error: err });

    res
      .status(503)
      .set({
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        "X-Content-Type-Options": "nosniff",
      })
      .send();
  }
};
