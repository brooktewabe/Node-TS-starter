import httpStatus from 'http-status';
import bcrypt from 'bcryptjs';
import random from 'random';
import jwt from 'jsonwebtoken';
import { userService } from './user.service.ts';
import { ApiError } from '../utils/ApiError.ts';
import { config } from '../config/envConfig.ts';
import { User } from '../models/user.model.ts';
import sendMessage from '../utils/sendSms.ts';
import { Session } from "../models/session.model.ts";
import { generateAuthTokens } from './token.service.ts';

export const login = async (phoneNumber: string, password: string, sourceApp: string) => {

  let user = await userService.getUserByPhone(phoneNumber)

  if (!user || !(await user.isPasswordMatch(password))) {
    if (user) {
      user.loginAttemptCount = (user.loginAttemptCount || 0) + 1;
      user.lastLoginAttempt = new Date();

      // If user reaches max attempts (5)
      if (user.loginAttemptCount >= 5) {
        user.accountStatus = "INACTIVE";
        await user.save();
        throw new ApiError(
          httpStatus.UNAUTHORIZED,
          "Account is locked"
        );
      } else {
        const remaining = 5 - user.loginAttemptCount;
        await user.save();
        throw new ApiError(
          httpStatus.UNAUTHORIZED,
          `Incorrect credentials. You have ${remaining} attempt${remaining === 1 ? "" : "s"} left before your account is locked.`
        );
      }
    }

    // If user not found at all
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect credentials.");
  }

  if (user.accountStatus !== "ACTIVE") {
    throw new ApiError(httpStatus.FORBIDDEN, "Account is locked");
  }

  // Check if user is unverified
  if (!user.isVerified) {
    const otp = random.int(100000, 999999);
    user.OTP = otp;
    user.otpExpiry = Date.now() + 3 * 60 * 1000;
    await user.save();

    await sendMessage(user.phoneNumber, `Your OTP: ${otp}`);
    return {
      isOTP: true,
      message: "OTP sent. Please verify your account.",
      otp: config.env === 'development' ? otp : undefined,
    };
  }
  // Reset login attempt count on successful login
  user.loginAttemptCount = 0;
  user.lastOnlineDate = new Date();
  await user.save();
  
  // Deactivate all existing active sessions
  await Session.updateMany(
    { userId: user._id, isActive: true },
    { $set: { isActive: false } }
  );

  // Create new session
  const session = await Session.create({ userId: user._id, isActive: true });

  // Generate JWT with sessionId
  const { access } = await generateAuthTokens(user._id as any, session._id as any);

  return { user, access };
};
export const forgotPassword = async (phoneNumber: string) => {

  let user = await userService.getUserByPhone(phoneNumber);

  if (!user || user.isDeleted) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (user.accountStatus !== 'ACTIVE') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Account is not active');
  }
  if (!user.isVerified) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Account is not verified');
  }
  const otp = random.int(100000, 999999);
  user.OTP = otp;
  user.otpExpiry = Date.now() + 2 * 60 * 1000; // Set OTP expiry time to 2 minutes from now

  await user.save();

  await sendMessage(user.phoneNumber, `Your OTP: ${otp}`);

  return { message: 'OTP sent. Please verify your account.', status: httpStatus.OK, otp: config.env === 'development' ? otp : undefined };
};
export const resendOtp = async (phoneNumber: string) => {

  let user = await userService.getUserByPhone(phoneNumber);

  if (!user || user.isDeleted) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (user.accountStatus !== 'ACTIVE') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Account is not active');
  }

  const otp = random.int(100000, 999999);
  user.OTP = otp;
  user.otpExpiry = Date.now() + 3 * 60 * 1000; // Set OTP expiry time to 3 minutes from now

  await user.save();

  await sendMessage(user.phoneNumber, `Your OTP: ${otp}`);

  return { message: 'OTP sent. Please verify your account.', status: httpStatus.OK, otp: config.env === 'development' ? otp : undefined };
};

const verifyOtp = async (phoneNumber: string, otp: number) => {
  if (!phoneNumber || !otp) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Phone and OTP are required');
  }
  let user = await userService.getUserByPhone(phoneNumber)
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (user) {
    user.loginAttemptCount = (user.loginAttemptCount || 0) + 1;
    // Lock account if max attempts reached 5
    if (user.loginAttemptCount >= 5) {
      user.accountStatus = "INACTIVE";
      await user.save();
    }
    user.lastLoginAttempt = new Date();
    await user.save();
  }
  if (!user.OTP || user.OTP !== otp || user.otpExpiry < Date.now()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired OTP');
  }

  // Update user verification status
  user.isVerified = true;
  user.OTP = 0;
  await user.save();

  const resetToken = jwt.sign({ sub: user.id, phoneNumber: user.phoneNumber }, config.jwt.secret, { expiresIn: "3m" })

  return { message: "OTP verified successfully", status: 200, resetToken };
};
const verifyOtpAndLogin = async (phoneNumber: string, otp: number) => {
  if (!phoneNumber || !otp) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Phone and OTP are required');
  }
  let user = await userService.getUserByPhone(phoneNumber)
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (user) {
    user.loginAttemptCount = (user.loginAttemptCount || 0) + 1;
    // Lock account if max attempts reached 5
    if (user.loginAttemptCount >= 5) {
      user.accountStatus = "INACTIVE";
      await user.save();
    }
    user.lastLoginAttempt = new Date();
    await user.save();
  }
  if (!user.OTP || user.OTP !== otp || user.otpExpiry < Date.now()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired OTP');
  }

  // Update user verification status
  user.isVerified = true;
  user.OTP = 0;
  await user.save();

  // Reuse active session if one exists
  let session = await Session.findOne({ userId: user._id, isActive: true });

  // Create new session
  if (!session) {
  session = await Session.create({ userId: user._id, isActive: true });
  }  
  // Generate JWT with sessionId
  const { access } = await generateAuthTokens(user._id as any, session._id as any);

  return { user, access };

};
const resetPassword = async (phoneNumber: string, newPassword: string, resetToken: string) => {

  try {
    const decoded: any = jwt.verify(resetToken, config.jwt.secret)
    if (decoded.phoneNumber !== phoneNumber) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid reset token")
    }
    let user = await userService.getUserByPhone(phoneNumber)
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found")
    }

    if (!user.isVerified) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Please verify your number first")
    }

    // Initialize PINHistory if not
    if (!user.PINHistory) {
      user.PINHistory = [];
    }
    // Include current password in previous passwords if it exists
    const previousPasswords: string[] = [...user.PINHistory];
    if (user.password) previousPasswords.push(user.password);

    for (const hashedPassword of previousPasswords) {
      const matches = await bcrypt.compare(newPassword, hashedPassword);
      if (matches) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Cannot reuse recent passwords");
      }
    }

    // Add current password to history if it exists (before changing it)
    if (user.password) {
      user.PINHistory.push(user.password);
    }

    // Keep only last 4 passwords in history (before adding new one)
    if (user.PINHistory.length > 4) {
      user.PINHistory.shift()
    }
    
    user.passwordChangedAt = new Date()
    user.lastModified = new Date()
    user.password = newPassword
    user.hasReset = true

    await user.save()

    user.PINHistory.push(user.password);

    // Keep only last 4 passwords 
    if (user.PINHistory.length > 4) {
      user.PINHistory.shift()
    }

    await user.save()

  // Reuse active session if one exists
  let session = await Session.findOne({ userId: user._id, isActive: true });

  // Create new session
  if (!session) {
  session = await Session.create({ userId: user._id, isActive: true });
  }  
  // Generate JWT with sessionId
  const { access } = await generateAuthTokens(user._id as any, session._id as any);

  return { user, access };
  } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid or expired reset token")
      }
    throw error
  }
}
export const changePassword = async (userId: string, currentPassword: string, newPassword: string) => {
  try {
    const user = await User.findById(userId)

    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found")
    }

    const isPasswordValid = await user.isPasswordMatch(currentPassword)

    if (!isPasswordValid) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Current password is incorrect")
    }

    if (user.PINHistory && user.PINHistory.length > 0) {

      for (const hashedPassword of user.PINHistory) {
        const matches = await bcrypt.compare(newPassword, hashedPassword)
        if (matches) {
          throw new ApiError(httpStatus.BAD_REQUEST, "Cannot reuse recent passwords")
        }
      }
    }

    if (!user.PINHistory) {
      user.PINHistory = []
    }

    user.PINHistory.push(user.password)

    // Keep only last 4 passwords
    if (user.PINHistory.length > 4) {
      user.PINHistory.shift()
    }

    user.password = newPassword
    user.passwordChangedAt = new Date()
    user.lastModified = new Date()

    await user.save()

    return { success: true }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Password change failed")
  }
}

export const authService = {
  login,
  verifyOtp,
  verifyOtpAndLogin,
  // refreshAuthToken,
  changePassword,
  resetPassword,
  resendOtp,
  forgotPassword,
};