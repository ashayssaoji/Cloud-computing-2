const AWS = require("aws-sdk");
const logger = require("../config/logger"); // Import logger

const cloudwatch = new AWS.CloudWatch({
  region: process.env.AWS_REGION || "us-east-2",
});

module.exports = (sequelize, DataTypes) => {
  const HealthCheck = sequelize.define(
    "HealthCheck",
    {
      checkId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      datetime: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },
    },
    {
      timestamps: false,
      tableName: "health_checks",
    }
  );

  // Override the default Sequelize findAll method to track query execution time
  HealthCheck.findAllWithMetrics = async function (options) {
    const startTime = Date.now();
    try {
      const result = await HealthCheck.findAll(options);
      return result;
    } catch (error) {
      logger.error("Error executing findAll query in HealthCheck model", {
        error,
      });
      throw error;
    } finally {
      const duration = Date.now() - startTime;

      // Send query execution time metric to CloudWatch
      await cloudwatch
        .putMetricData({
          Namespace: "WebApp/Database",
          MetricData: [
            {
              MetricName: "HealthCheckModelQueryDuration",
              Dimensions: [{ Name: "Model", Value: "HealthCheck" }],
              Value: duration,
              Unit: "Milliseconds",
            },
          ],
        })
        .promise();

      logger.info(`Query execution time in HealthCheck model: ${duration}ms`);
    }
  };

  return HealthCheck;
};
