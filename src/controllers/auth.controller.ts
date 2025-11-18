import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { userService } from "../services/user.service.ts";
import { authService } from "../services/auth.service.ts";
import { ApiError } from "../utils/ApiError.ts";
import type { IUser } from "../config/types/Users.d.ts";
import { config } from "../config/envConfig.ts";

interface AuthRequest extends Request {
  user?: IUser;
}
export const isTokenExpired = (
  encryptedAt: string,
  maxMinutes = 10
): boolean => {
  const diffMs = Date.now() - new Date(encryptedAt).getTime();
  return diffMs > maxMinutes * 60 * 1000;
};

export const healthcheck = async (req: Request, res: Response) => {
  return res.status(200).json({ message: "server is up 200" });
};


export const create = async (req: AuthRequest, res: Response) => {
  try {
    const user = await userService.createUser(req.body);

    res.status(httpStatus.CREATED).send({
      message: "Registered successfully",
      id: user._id,
      otp: config.env === "development" ? user.OTP : null,
    });
  } catch (error) {
    res.status(httpStatus.BAD_REQUEST).send({
      message: error instanceof Error ? error.message : "Registration failed",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { phoneNumber, password } = req.body;
    const sourceApp = req.headers["sourceapp"] as string;
    if (!sourceApp) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .send({ message: "UNAUTHORIZED" });
    }
    const result = await authService.login(phoneNumber, password, sourceApp);

    // Handle OTP response
    if (result.isOTP) {
      return res.status(httpStatus.OK).send({
        message: result.message,
        status: httpStatus.OK,
        otp: result.otp,
      });
    }
    const { user, access } = result;
    const User = {
      phoneNumber: user?.phoneNumber,
      role: user?.role,
      name: user?.fullName,
    };
    res.status(httpStatus.OK).send({
      message: "Login successful",
      status: httpStatus.OK,
      data: { User, access },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).send({
        message: error.message,
        status: error.statusCode,
      });
    } else {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
        message: "Something went wrong",
        error,
        status: httpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    const userId = req.user._id?.toString();

    if (!req.body || Object.keys(req.body).length === 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Update data is required");
    }
    if (
      req.body.phoneNumber ||
      req.body.password ||
      req.body.role ||
      req.body.isVerified 
    ) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Unauthorized fields");
    }

    const updatedUser = await userService.updateUser(userId!, req.body);

    if (!updatedUser) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    res.status(httpStatus.OK).json({
      message: "User updated successfully",
      data: updatedUser,
      status: httpStatus.OK,
    });
  } catch (error) {
    next(error);
  }
};
export const updateUserByAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      throw new ApiError(httpStatus.BAD_REQUEST, "User ID is required");
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Update data is required");
    }
    if (
      req.body._id ||
      req.body.password ||
      req.body.isVerified
    ) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Unauthorized fields");
    }
    const updatedUser = await userService.updateAnyUser(userId, req.body);

    if (!updatedUser) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    res.status(httpStatus.OK).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;

    const response = await authService.forgotPassword(phoneNumber);
    res.status(httpStatus.OK).send(response);
  } catch (error) {
    const statusCode =
      error instanceof ApiError
        ? error.statusCode
        : httpStatus.INTERNAL_SERVER_ERROR;
    res.status(statusCode).send({
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};
export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const authReq = req as AuthRequest;

    if (!authReq.user?._id) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Authentication required");
    }

    await authService.changePassword(
      authReq.user._id.toString(),
      currentPassword,
      newPassword
    );

    res.status(httpStatus.OK).send({
      status: httpStatus.OK,
      message: "Password changed successfully",
    });
  } catch (error) {
    res
      .status(
        error instanceof ApiError
          ? error.statusCode
          : httpStatus.INTERNAL_SERVER_ERROR
      )
      .send({
        success: false,
        message:
          error instanceof Error ? error.message : "Password change failed",
      });
  }
};

export const toggleAccountStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.query;
    const reason = req.body.reason;

    if (typeof id !== "string") {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid user ID");
    }
    const user = await userService.toggleAccountStatus(id, reason);

    if (!user) {
      res.status(httpStatus.NOT_FOUND).send({ message: "User not found" });
      return;
    }

    res.status(httpStatus.OK).send({
      message: `Account status changed to ${user.accountStatus.toLowerCase()}`,
      status: httpStatus.OK,
    });
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      message: error instanceof Error ? error.message : "An error occurred",
    });
  }
};

const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phoneNumber, otp } = req.body;
    const result = await authService.verifyOtp(phoneNumber, parseInt(otp, 10));
    res.status(httpStatus.OK).json(result);
  } catch (error) {
    next(error);
  }
};
const verifyOtpAndLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { phoneNumber, otp } = req.body;
    const { user, access } = await authService.verifyOtpAndLogin(
      phoneNumber,
      parseInt(otp, 10)
    );

    if (!user) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        "User not found or password reset failed"
      );
    }

    const User = {
      phoneNumber: user?.phoneNumber,
      role: user?.role,
      name: user?.fullName,
    };

    res.status(httpStatus.OK).send({
      message: "OTP verified successfully",
      data: { User, access },
      status: httpStatus.OK,
    });
  } catch (error) {
    next(error);
  }
};
export const checkUser = async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;

    let user = await userService.getUserByPhone(phoneNumber);
    if (!user || user.accountStatus !== "ACTIVE") {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .send({ message: "User not found", status: httpStatus.BAD_REQUEST });
    }

    res.status(httpStatus.OK).send({
      isVerified: user.isVerified,
    });
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};

const resendOtp = async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;

    const response = await authService.resendOtp(phoneNumber);
    res.status(httpStatus.OK).send(response);
  } catch (error) {
    const statusCode =
      error instanceof ApiError
        ? error.statusCode
        : httpStatus.INTERNAL_SERVER_ERROR;
    res.status(statusCode).send({
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};
const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { phoneNumber, newPassword, resetToken } = req.body;
    const sourceApp = req.headers["sourceapp"] as string;

    if (!sourceApp) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .send({ message: "Missing sourceApp in headers" });
    }
    if (!resetToken) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Reset token is required");
    }

    await authService.resetPassword(
      phoneNumber,
      newPassword,
      resetToken
    );
    const { user, access } = await authService.login(
      phoneNumber,
      newPassword,
      sourceApp
    );

    if (!user) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        "Password reset failed"
      );
    }

    const User = {
      phoneNumber: user?.phoneNumber,
      role: user?.role,
      name: user?.fullName,
    };

    res.status(httpStatus.OK).send({
      message: "Login successful",
      data: { User, access },
      status: httpStatus.OK,
    });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 10, search, realm } = req.query;
    const parsedPage = parseInt(page as string, 10) || 1;
    const parsedLimit = parseInt(limit as string, 10) || 10;

    const users = await userService.getUsers(
      req.user?._id as string,
      parsedPage,
      parsedLimit,
      search as string,
      realm as string
    );

    res.status(200).json({
      message: "Users fetched successfully",
      data: users,
      status: httpStatus.OK,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.query;

    if (!id) {
      throw new ApiError(httpStatus.BAD_REQUEST, "User ID is required");
    }

    await userService.deleteUser(id as string);
    res
      .status(200)
      .json({ message: "User Deleted successfully", status: httpStatus.OK });
  } catch (error) {
    next(error);
  }
};

export const getRecentLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const count = parseInt(req.query.count as string) || 10;
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const logPath = path.join(__dirname, "../logs/debug.log");

  fs.readFile(logPath, "utf8", (err, data) => {
    if (err) {
      console.error("Failed to read logs:", err);
      return res.status(500).json({ message: "Unable to read log file." });
    }

    const lines = data.trim().split("\n");
    const lastLogs = lines.slice(-count).reverse();
    return res.json({ logs: lastLogs });
  });
};


export const authController = {
  healthcheck,
  create,
  login,
  changePassword,
  updateProfile,
  updateUserByAdmin,
  verifyOtp,
  verifyOtpAndLogin,
  checkUser,
  forgotPassword,
  resetPassword,
  resendOtp,
  getUsers,
  toggleAccountStatus,
  deleteUser,
  getRecentLogs,
};
