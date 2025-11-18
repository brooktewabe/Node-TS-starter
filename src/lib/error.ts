import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { config } from '../config/envConfig.ts';
import { ApiError } from '../utils/ApiError.ts';
import { logger } from '../config/logger.ts';
import mongoose from 'mongoose';

export const errorConverter = (err: any, req: Request, res: Response, next: NextFunction) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode =  error.statusCode || error instanceof mongoose.Error
        ? httpStatus.BAD_REQUEST
        : httpStatus.INTERNAL_SERVER_ERROR;
    const message = error.message || httpStatus[statusCode];
    error = new ApiError(statusCode, message, false, error.stack);
  }
  next(error);
};

export const errHandler = (err: ApiError, req: Request, res: Response, _next: NextFunction) => {
  let { statusCode, message } = err;

  if (config.env === 'production' && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = String(httpStatus[statusCode as keyof typeof httpStatus]);
  }


  const response = {
    error: true,
    code: statusCode,
    message,
    ...(config.env === 'development' && { stack: err.stack }),
  };

  res.locals.errorMessage = message;

  if (config.env === 'development') {
    logger.info(err);
  }

  res.status(statusCode).send(response);
};