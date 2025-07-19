"use strict";
const { Model } = require("sequelize");
const AWS = require("aws-sdk");
const logger = require("../config/logger"); // Import logger

const cloudwatch = new AWS.CloudWatch({
  region: process.env.AWS_REGION || "us-east-2",
});

module.exports = (sequelize, DataTypes) => {
  class File extends Model {
    static associate(models) {
      // Define associations if needed
    }

    // Override the default Sequelize findAll method to track query execution time
    static async findAllWithMetrics(options) {
      const startTime = Date.now();
      try {
        const result = await File.findAll(options);
        return result;
      } catch (error) {
        logger.error("Error executing findAll query in File model", { error });
        throw error;
      } finally {
        const duration = Date.now() - startTime;

        // Send query execution time metric to CloudWatch
        await cloudwatch
          .putMetricData({
            Namespace: "WebApp/Database",
            MetricData: [
              {
                MetricName: "FileModelQueryDuration",
                Dimensions: [{ Name: "Model", Value: "File" }],
                Value: duration,
                Unit: "Milliseconds",
              },
            ],
          })
          .promise();

        logger.info(`Query execution time in File model: ${duration}ms`);
      }
    }
  }

  File.init(
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
      },
      file_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      url: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      upload_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "File",
      tableName: "Files",
      timestamps: false,
    }
  );

  return File;
};
