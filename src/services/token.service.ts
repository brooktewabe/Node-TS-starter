import jwt from 'jsonwebtoken';
import dayjs from 'dayjs';
import { config } from '../config/envConfig.ts';
import { tokenTypes, TokenType } from '../config/tokens.ts';

interface TokenPayload {
  sub: string;
  iat: number;
  exp: number;
  type: TokenType;
  sessionId: string;
}

export const generateToken = (
  userId: string,
  expires: dayjs.Dayjs,
  type: TokenType,
  secret: string = config.jwt.secret,
  sessionId: string
): string => {
  const payload: TokenPayload = {
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: expires.unix(),
    type,
    sessionId
  };
  if (sessionId) {
    payload.sessionId = sessionId;
  }
  return jwt.sign(payload, secret);
};

export const generateAuthTokens = async (userId: string , sessionId: string) => {
  const accessTokenExpires = dayjs().add(
    config.jwt.accessExpirationMinutes,
    'minutes'
  );
  const accessToken = generateToken(
    userId.toString(),
    accessTokenExpires,
    tokenTypes.ACCESS,
    config.jwt.secret,
    sessionId.toString()
  );


  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
  };
};

export const tokenService = {
  generateToken,
  generateAuthTokens,
  // verifyToken,
};