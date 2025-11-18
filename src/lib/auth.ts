import { Request, Response, NextFunction, RequestHandler } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import { ApiError } from '../utils/ApiError.ts';
import type { IUser } from '../config/types/Users.js';
import { tokenBlacklist } from '../utils/tokenBlacklist.ts';
import { config } from '../config/envConfig.ts';
import { Session } from '../models/session.model.ts';
import { generateAuthTokens } from '../services/token.service.ts';

interface AuthenticatedRequest extends Request {
  user?: IUser;
}

const verifyCallback = (
  req: AuthenticatedRequest,
  resolve: Function,
  reject: Function
) => async (err: any, user: IUser | false, info: any) => {
  if (err || info || !user) {
    return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
  }

  // If user is active and was previously blacklisted, remove from blacklist
  if (user.accountStatus === 'ACTIVE' && tokenBlacklist.isBlacklisted(user.id)) {
    tokenBlacklist.removeFromBlacklist(user.id);
  }
  
  // Check if user is blacklisted
  if (tokenBlacklist.isBlacklisted(user.id)) {
    return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Token has been revoked'));
  }

  // Check if user account is inactive
  if (user.accountStatus !== 'ACTIVE') {
    // Get token expiration from JWT
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.decode(token) as { exp: number };
        if (decoded.exp) {
          tokenBlacklist.addToBlacklist(user.id, decoded.exp);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
    return reject(new ApiError(httpStatus.FORBIDDEN, 'Account is not active'));
  }
  // Session-based JWT validation
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return reject(new ApiError(httpStatus.UNAUTHORIZED, 'No token provided'));
  }
  let decoded: any;
  try {
    decoded = jwt.verify(token, config.jwt.secret);
  } catch (err) {
    return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired token'));
  }
  // Check session
  const session = await Session.findById(decoded.sessionId);
  if (!session || !session.isActive) {
    return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Session invalid or expired'));
  }
  // rolling session (issue new token if close to expiry - 5 minutes )
  const now = Math.floor(Date.now() / 1000);
  if (decoded.exp - now < 300) { 
    const { access } = await generateAuthTokens(user._id as any, session._id as any);
    (req as any).newToken = access.token;
  }

  req.user = user;
  resolve();
};

export const auth = (): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      await new Promise<void>((resolve, reject) => {
        passport.authenticate(
          'jwt',
          { session: false },
          verifyCallback(authenticatedReq, resolve, reject)
        )(authenticatedReq, res, next);
      });

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      next(error);
    }
  };
};
