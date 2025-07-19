require("dotenv").config();
const AWS = require("aws-sdk");
const logger = require("./logger"); // We will create this file next

// Set AWS region
AWS.config.update({
  region: process.env.AWS_REGION || "us-east-2",
});

module.exports = {
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  dialect: process.env.DB_DIALECT || "mysql",
  port: process.env.DB_PORT || 3306,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  logging: (msg) => logger.info(`Sequelize: ${msg}`), // Logs SQL queries in CloudWatch
};
