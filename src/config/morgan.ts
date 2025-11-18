import morgan from "morgan";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createStream } from "rotating-file-stream";
import { config } from "./envConfig.ts"; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logDir = path.join(__dirname, "..", "logs");

// Ensure logs directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Create a generator function for log file names based on date
  const accessLogStream = createStream((time, index) => {
    const now = time ? new Date(time) : new Date();

    // Convert UTC to local (Ethiopia is UTC+3)
    const offsetMs = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
    const localTime = new Date(now.getTime() + offsetMs);

    // Format YYYY-MM-DD using local time
    const year = localTime.getFullYear();
    const month = String(localTime.getMonth() + 1).padStart(2, "0");
    const day = String(localTime.getDate()).padStart(2, "0");
    const date = `${year}-${month}-${day}`;

    return `${date}.log`;
  }, {
    interval: "1d",
    path: logDir,
    maxFiles: 30,
    // compress: "gzip",
  });
// Custom token for error messages
morgan.token("message", (req, res: any) => res.locals.errorMessage || "");
morgan.token("user-id", (req: any) => req.user?._id || "");
morgan.token("phoneNumber", (req: any) => req.user?.phoneNumber || "");
morgan.token("ip", (req: any) => req.ip || "");

const getIPFormat = () =>
  config.env === "production" ? ":remote-addr - " : "";

const successResponseformat = `${getIPFormat()} :method :url :status :response-time ms :user-agent :date user-id: :user-id phoneNumber: :phoneNumber`;
export const successHandler = morgan(successResponseformat, {
  stream: accessLogStream,
  skip: (req, res) => res.statusCode >= 400,
});

const errorResponseformat = `${getIPFormat()} :method :url :status :response-time ms :user-agent :date user-id: :user-id phoneNumber: :phoneNumber - error-message: :message`;
export const errorHandler = morgan( errorResponseformat, {
  stream: accessLogStream,
  skip: (req, res) => res.statusCode < 400,
});
