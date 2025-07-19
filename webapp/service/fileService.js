const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");
const db = require("../models");
const File = db.File;

const bucketName = process.env.S3_BUCKET_NAME;
const awsRegion = process.env.AWS_REGION;

// Initialize S3 Client using IAM Role
const s3 = new S3Client({ region: awsRegion });

const uploadFile = async (file) => {
  try {
    const fileKey = `${Date.now()}_${uuidv4()}_${file.originalname}`;

    const params = {
      Bucket: bucketName,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    await s3.send(new PutObjectCommand(params));

    const fileUrl = `https://${bucketName}.s3.${awsRegion}.amazonaws.com/${fileKey}`;

    const fileRecord = await File.create({
      id: fileKey,
      file_name: file.originalname,
      url: fileUrl,
      upload_date: new Date(),
    });

    return {
      file_id: fileRecord.id,
      file_name: fileRecord.file_name,
      url: fileRecord.url,
      upload_date: fileRecord.upload_date.toISOString(),
    };
  } catch (error) {
    console.error("S3 Upload Error:", error);
    throw new Error("Failed to upload file");
  }
};

const getFileMetadata = async (fileId) => {
  try {
    const fileRecord = await File.findOne({ where: { id: fileId } });

    if (!fileRecord) {
      throw new Error("File not found in the database");
    }

    return {
      file_name: fileRecord.file_name,
      id: fileRecord.id,
      url: fileRecord.url,
      upload_date: fileRecord.upload_date.toISOString(),
    };
  } catch (error) {
    console.error("Error fetching file metadata:", error);
    throw new Error("Failed to fetch file metadata");
  }
};

const deleteFile = async (fileId) => {
  try {
    const fileRecord = await File.findOne({ where: { id: fileId } });

    if (!fileRecord) {
      throw new Error("File not found in database");
    }

    const params = { Bucket: bucketName, Key: fileRecord.id };
    await s3.send(new DeleteObjectCommand(params));

    await File.destroy({ where: { id: fileId } });

    return { message: "File deleted successfully" };
  } catch (error) {
    console.error("S3 Delete Error:", error);
    throw new Error("Failed to delete file");
  }
};

module.exports = {
  uploadFile,
  getFileMetadata,
  deleteFile,
};
