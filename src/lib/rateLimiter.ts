import { Request, Response, NextFunction } from 'express';
import { RateLimiterMongo } from 'rate-limiter-flexible';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import { config } from '../config/envConfig.ts';
import { ApiError } from '../utils/ApiError.ts';

const rateLimiterOptions = {
  storeClient: mongoose.connection,
  dbName: config.dbName,
  blockDuration: 60 * 60 * 24, // 24 hours
};

// Limit requests per day per IP
const slowerBruteLimiter = new RateLimiterMongo({
  ...rateLimiterOptions,
  points: config.rateLimiter.maxAttemptPerDay,
  duration: 60 * 60 * 24, // 24 hours
});

const authLimiter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const ipAddr =
    req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
    req.socket.remoteAddress ||
    '';

  try {
    const slowerBruteRes = await slowerBruteLimiter.get(ipAddr);

    if (
      slowerBruteRes !== null &&
      slowerBruteRes.consumedPoints >= config.rateLimiter.maxAttemptPerDay
    ) {
      const retrySeconds = Math.ceil(slowerBruteRes.msBeforeNext / 1000);
      res.set('Retry-After', String(retrySeconds));
      console.log('Too many requests. Try again after', retrySeconds, 'seconds');
      throw new ApiError(httpStatus.TOO_MANY_REQUESTS, 'Too many requests');
    }

    // Consume 1 point for this request
    await slowerBruteLimiter.consume(ipAddr);

    next();
  } catch (error) {
    if (error instanceof Error && (error as any).msBeforeNext) {
      const retrySeconds = Math.ceil((error as any).msBeforeNext / 1000);
      res.set('Retry-After', String(retrySeconds));
      console.log('Rate limit hit. Retry after', retrySeconds, 'seconds');
      return next(new ApiError(httpStatus.TOO_MANY_REQUESTS, 'Too many requests'));
    }
    next(error);
  }
};

export { slowerBruteLimiter, authLimiter };