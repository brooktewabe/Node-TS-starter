import httpStatus from "http-status";
import mongoose from "mongoose";
import random from "random";
import { User } from "../models/user.model.ts";
import { ApiError } from "../utils/ApiError.ts";
import { paginate } from "../utils/pagination.ts";
import type { IUser } from "../config/types/Users.js";
import sendMessage from "../utils/sendSms.ts";
import permissionGroupModel from "../models/permissionGroup.model.ts";
import { validateAndFormatPhoneNumber } from "../lib/formatPhoneNumber.ts";

export const createUser = async (userBody: any): Promise<IUser> => {
  let phone = userBody.phoneNumber;

  // Remove +251 if it exists
  if (phone.startsWith("+251")) {
    phone = phone.replace("+251", "");
  }

  phone = phone.replace(/^0+/, "");

  if (userBody.phoneNumber) {
    try {
      userBody.phoneNumber = validateAndFormatPhoneNumber(userBody.phoneNumber);
    } catch (error) {
      throw new ApiError(httpStatus.BAD_REQUEST, (error as Error).message);
    }
  }

  const userData = await getUserByPhone(
    userBody.phoneNumber!,
  ); 
  if (userData) throw new ApiError(httpStatus.BAD_REQUEST, "Phone number already taken");

  // Automatically assign permission group
    const permissionGroup = await permissionGroupModel.findOne({
      groupName: userBody.role,
    });
    if (!permissionGroup) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `No permission group found for role ${userBody.role}`
      );
    }
    userBody.permissionGroup = [permissionGroup._id];

  const user = await User.create(userBody);
  return user;
};

export const getUserByPhone = async (
  phoneNumber: string,
): Promise<IUser | null> => {
  return User.findOne({phoneNumber});
};

export const getUserById = async (id: string): Promise<IUser | null> => {
  return User.findById(id);
};

export const getUsers = async (
  id: string,
  page: number = 1,
  limit: number = 10,
  search: string = "",
  realm: string = ""
) => {
  const filter: any = {};
  if (search && typeof search === "string") {
    filter.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { phoneNumber: { $regex: search, $options: "i" } },
    ];
  }
  if (realm && typeof realm === "string") {
    filter.realm = { $regex: realm, $options: "i" };
  }

  return paginate<typeof User>(User, page, limit, filter);
};

export const updateUser = async (
  userId: string,
  updateBody: Partial<IUser>
): Promise<IUser | null> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  if (updateBody.phoneNumber && updateBody.phoneNumber !== user.phoneNumber) {
    const isPhoneTaken = await User.isPhoneTaken(
      updateBody.phoneNumber,
    );
    if (isPhoneTaken) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Phone Number is already taken"
      );
    }
  }

  Object.assign(user, updateBody);
  await user.save();

  return user;
};
export const updateAnyUser = async (
  userId: string,
  updateBody: Partial<IUser>
): Promise<IUser | null> => {
  const user = await User.findOne({ userId });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // Prevent role downgrade for super admins
  if (
    user.role === "super_admin" &&
    updateBody.role &&
    updateBody.role !== "super_admin"
  ) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Super admin role cannot be changed"
    );
  }

  // If role is being updated, also update permissionGroup
  if (updateBody.role) {
    const permissionGroup = await permissionGroupModel.findOne({
      groupName: updateBody.role,
    });
    if (!permissionGroup) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `No permission group found for role ${updateBody.role}`
      );
    }
    updateBody.permissionGroup = [permissionGroup._id];
  }

  // Validate and format phone number if provided
  if (updateBody.phoneNumber) {
    try {
      updateBody.phoneNumber = validateAndFormatPhoneNumber(
        updateBody.phoneNumber
      );
    } catch (error) {
      throw new ApiError(httpStatus.BAD_REQUEST, (error as Error).message);
    }
  }

  // Prevent phone conflicts
  if (updateBody.phoneNumber && updateBody.phoneNumber !== user.phoneNumber) {
    const isPhoneTaken = await User.isPhoneTaken(
      updateBody.phoneNumber,
    );
    if (isPhoneTaken) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Phone is already taken");
    }
  }

  // Apply updates safely
  user.set(updateBody);
  for (const key in updateBody) {
    user.markModified(key);
  }
  await user.save();

  return user;
};
export const toggleAccountStatus = async (
  id: string,
  reason: string = ""
): Promise<IUser | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null; 

  const userID = new mongoose.Types.ObjectId(id);
  const user = await User.findOne({ _id: userID });
  if (!user) return null;

  const status = user.accountStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  return await User.findOneAndUpdate(
    { _id: id },
    { accountStatus: status, loginAttemptCount: 0, disableReason: reason },
    { new: true }
  );
};

const deleteUser = async (id: string): Promise<IUser | null> => {
  const user = await User.findOne({ _id: id });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.role === "super_admin") {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Cannot delete super admin account"
    );
  }
  return await User.findOneAndDelete({_id:id});
};


export const userService = {
  createUser,
  getUserById,
  getUsers,
  updateAnyUser,
  getUserByPhone,
  updateUser,
  deleteUser,
  toggleAccountStatus,
};
