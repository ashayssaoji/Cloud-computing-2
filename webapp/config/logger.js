const fs = require("fs");
const path = require("path");
const winston = require("winston");
require("winston-cloudwatch");
const AWS = require("aws-sdk");

// Determine log path based on environment
const isEC2 = process.env.EC2_ENV === "true"; // you can set this in your EC2 .env
const logFilePath = isEC2
  ? "/opt/webapp/webapp.log"
  : path.join(__dirname, "..", "logs", "webapp.log");

// Ensure log directory exists for local environment
if (!isEC2) {
  const logDir = path.dirname(logFilePath);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}

// CloudWatch config
const cloudwatchConfig = {
  logGroupName: "webapp-logs",
  logStreamName: process.env.INSTANCE_ID || "local-instance",
  awsRegion: process.env.AWS_REGION || "us-east-2",
};

AWS.config.update({ region: cloudwatchConfig.awsRegion });

// CloudWatch Transport
const cloudwatchTransport = new winston.transports.CloudWatch({
  logGroupName: cloudwatchConfig.logGroupName,
  logStreamName: cloudwatchConfig.logStreamName,
  awsRegion: cloudwatchConfig.awsRegion,
  jsonMessage: true,
});

// Create logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: logFilePath }),
    new winston.transports.Console(),
    cloudwatchTransport,
  ],
});

logger.exceptions.handle(
  new winston.transports.File({ filename: logFilePath }),
  cloudwatchTransport
);

module.exports = logger;
