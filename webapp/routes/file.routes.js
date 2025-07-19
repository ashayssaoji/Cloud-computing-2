const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

router.head("/file", (req, res) => {
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  res.set("Pragma", "no-cache");
  res.set("X-Content-Type-Options", "nosniff");
  res.status(405).send();
});

const fileController = require("../controllers/file.controller");

//   Allowed Methods
router.post(
  "/file",
  upload.single("file"),
  fileController.uploadFileController
);
router.get("/file/:id", fileController.getFileController);
router.delete("/file/:id", fileController.deleteFileController);

const methodNotAllowed = (req, res) => {
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  res.set("Pragma", "no-cache");
  res.set("X-Content-Type-Options", "nosniff");
  res.status(405).send();
};

// Apply 405 restriction to specific methods
router.patch("/file", methodNotAllowed);
router.put("/file", methodNotAllowed);
router.head("/file/:id", methodNotAllowed);
router.options("/file/:id", methodNotAllowed);
router.patch("/file/:id", methodNotAllowed);
router.put("/file/:id", methodNotAllowed);

router.head("/file", methodNotAllowed);
router.head("/file/:id", methodNotAllowed);

//   400 Bad Request for malformed requests on `/file`
router.all("/file", (req, res) => {
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  res.set("Pragma", "no-cache");
  res.set("X-Content-Type-Options", "nosniff");
  res.status(400).send();
});

//   405 Method Not Allowed for unsupported `/file/:id` methods
router.all("/file/:id", methodNotAllowed);

//   404 Not Found for everything else
router.all("*", (req, res) => {
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  res.set("Pragma", "no-cache");
  res.set("X-Content-Type-Options", "nosniff");
  res.status(404).send();
});

module.exports = router;
