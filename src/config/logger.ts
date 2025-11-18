import fs from "fs";
import path from "path";
import winston from 'winston';
import { fileURLToPath } from "url";

const { format, createLogger, transports } = winston;
const { printf, combine, timestamp, colorize, uncolorize } = format;

// Ensure logs directory exists
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logDir = path.join(__dirname, "..", "logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const winstonFormat = printf(
  ({ level, message, timestamp, stack }: winston.Logform.TransformableInfo) =>
    `${timestamp}: ${level}: ${stack || message}`,
);

// Create base logger without environment-specific configuration
const logger = createLogger({
  format: combine(timestamp(), winstonFormat),
  transports: [
    new transports.Console(),
    new transports.File({ filename: path.join(logDir, "debug.log") }), 
  ],
});

// Function to configure logger based on environment
export const configureLogger = (env: string) => {
  logger.level = env === 'development' ? 'debug' : 'info';
  logger.format = combine(
    timestamp(),
    winstonFormat,
    env === 'development' ? colorize() : uncolorize(),
  );
};

export { logger };