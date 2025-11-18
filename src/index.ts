import express from "express";
import xss from 'xss-clean';
import dotenv from "dotenv";
import cors from "cors";
import mongoSanitize from "express-mongo-sanitize";
import helmet from "helmet";
import passport from "passport";
import httpStatus from "http-status";
import { config } from "./config/envConfig.ts";
import { successHandler, errorHandler } from "./config/morgan.ts";
import { ApiError } from "./utils/ApiError.ts";
import { errorConverter, errHandler } from "./lib/error.ts";
import connectDB from "./config/mongoose.ts";
import { jwtStrategy } from "./config/passport.ts";
import { seedSuperAdmin } from './lib/adminSeeder.ts';
import { envValidation } from './validations/index.ts'
import populatePermissions from "./lib/populate_permissions.ts";
import initRoutes from "./api/index.ts";

dotenv.config();

// Validate env vars
const { error } = envValidation.validate(process.env);
if (error) {
  console.error('❌ Environment variable validation error:', error.message);
  process.exit(1);
}

const app = express();
app.use(express.json());
app.use(successHandler);
app.use(errorHandler);
// Middleware to sanitize all inputs
app.use(xss());
app.use(mongoSanitize());
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

app.use(
  helmet.contentSecurityPolicy({
    directives: config.cspOptions.directives,
    //blocks if there's Violation
    reportOnly: false,
  })
);
app.use(helmet.xFrameOptions()); //  to deny X-Frame-options
app.use(helmet.noSniff());
const port = config.port;

if (config.env === 'production') {
  app.use(cors({ origin: [
    'url',
  ]}));
  app.options('*', 
    cors({ origin: [
      'url',
    ]}));
} else {
  app.use(cors());
  app.options('*', cors());
}
app.set('trust proxy', true);

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl}`);
  next();
});
initRoutes(app);

connectDB();

const init = async () => {
  try {
    await populatePermissions();
    await seedSuperAdmin();
  } catch (error) {
    console.error("Initialization error:", error);
  }
};

init();

// path not found middleware
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, "404 Not found"));
});

// converter should be before handler since it handles those that are not handled intentionally
app.use(errorConverter);
app.use(errHandler);

app.listen(port, async() => {
  console.log(`Server is running on port ${config.port}`);
});