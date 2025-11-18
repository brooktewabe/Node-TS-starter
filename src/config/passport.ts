import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { config } from './envConfig.ts';
import { tokenTypes } from './tokens.ts';
import { userService } from '../services/user.service.ts';

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  ignoreExpiration: true, // for refreshing token manually
};

const jwtVerify = async (payload: any, done: any) => {
  try {
    if (payload.type !== tokenTypes.ACCESS) {
      throw new Error('Invalid token type');
    }
    const user = await userService.getUserById(payload.sub);
    if (!user) {
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    done(error, false);
  }
};

const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);

export {
  jwtStrategy,
};