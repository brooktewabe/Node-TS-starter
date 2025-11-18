import multer from "multer";
import path from "path";
import { Request } from "express";
import { fileURLToPath } from "url";
import fs from "fs";
import httpStatus from "http-status";
import { ApiError } from "../utils/ApiError.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, "../../uploads");
// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true }); 
}

const storage = multer.diskStorage({
  destination: (req: Request, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req: Request, file, cb) => {
    // Trim spaces, replace with underscores, and remove leading/trailing spaces
    const sanitizedFilename = file.originalname.trim().replace(/\s+/g, "_");
    const filename = `${Date.now()}-${sanitizedFilename}`;
    cb(null, filename);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 3 * 1024 * 1024, // 3MB file size limit
  },
  fileFilter: (req: Request, file, cb) => {
    const allowedExtensions = /\.(xlsx)$/i;
    if (!allowedExtensions.test(file.originalname)) {
      return cb(new ApiError(httpStatus.BAD_REQUEST, "Only excel is allowed"));
    }
    cb(null, true);
  },
});
