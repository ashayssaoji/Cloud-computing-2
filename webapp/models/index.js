const { Sequelize } = require("sequelize");
const dbConfig = require("../config/config");

// Initialize Sequelize First
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    port: dbConfig.port || 3306,
    logging: false,
  }
);

// Authenticate Connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully.");
  } catch (err) {
    // console.error("Unable to connect to the database:", err);
  }
})();

// Define DB Object AFTER Initializing Sequelize
const db = {};
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Import Models Here (After Initialization)
db.HealthCheck = require("./health.model")(sequelize, Sequelize);
db.File = require("./file.model")(sequelize, Sequelize); // Ensure this exists

module.exports = db;
