import dotenv from "dotenv";
import { logger, configureLogger } from "./logger.ts";
import { envValidation } from "../validations/index.ts";

dotenv.config();

const { value: envVars, error } = envValidation.validate(process.env);
if (error) {
  logger.error(error);
}

// Configure logger with environment
configureLogger(envVars.NODE_ENV);

export interface Config {
  port: number;
  dbConnection: string;
  env: string;
  sms_token: string;
  jwt: {
    secret: string;
    accessExpirationMinutes: number;
    // refreshExpirationDays: number;
  };
  cspOptions: {
    directives: {
      defaultSrc: string[];
      styleSrc: string[];
      scriptSrc: string[];
      fontSrc: string[];
    };
  };
  rateLimiter: {
    maxAttemptPerDay: number;
  };
  dbName: string;
}

export const config: Config = {
  port: envVars.PORT,
  dbConnection: envVars.DB_CONNECTION,
  env: envVars.NODE_ENV,
  sms_token: envVars.AFROMESSAGE_API_TOKEN,
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    // refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
  },
  cspOptions: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
    },
  },
  rateLimiter: {
    maxAttemptPerDay: envVars.MAX_ATTEMPT_PER_DAY,
  },
  dbName: envVars.DB_NAME,
};
