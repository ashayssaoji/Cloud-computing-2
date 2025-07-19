require("dotenv").config();
const express = require("express");
const db = require("./models");
const healthRoutes = require("./routes/health.routes");
const fileRoutes = require("./routes/file.routes");

const app = express();

// Middleware to log incoming requests
app.use((req, res, next) => {
  console.log(`Incoming Request: ${req.method} ${req.path}`);
  next();
});

// Register API routes
app.use("/", healthRoutes);
app.use("/v1", fileRoutes); //   Ensure correct API versioning

//  Database Sync (Creates Tables if Needed)
(async () => {
  try {
    await db.sequelize.sync({ alter: true });
    // console.log("  Database sync successful.");
  } catch (err) {
    // console.error("Database sync failed:", err);
  }
})();

// Catch 404 errors (Unhandled Routes)
app.use((req, res) => {
  res.status(404).send();
});

// Debug: Log all registered routes
app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    console.log(
      `Registered Route: ${Object.keys(middleware.route.methods)
        .join(", ")
        .toUpperCase()} ${middleware.route.path}`
    );
  }
});

// app.all("*", (req, res) => {
//   res.status(404).json({ error: "Endpoint not found" });
// });

// Start Server
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
