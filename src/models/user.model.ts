import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import type { IUser, IUserModel } from "../config/types/Users.d.ts";

const userSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      // unique: true,
      required: true,
      trim: true,
      index: true,
    },
    isVerified: { type: Boolean, default: false },
    OTP: { type: Number },
    otpExpiry: { type: Number },
    permissionGroup: [{ type: Schema.Types.ObjectId, ref: "PermissionGroup" }],
    role: {
      type: String,
      trim: true,
      enum: ["cashier",  "super_admin"],
    },
    stationId:{ type:Schema.Types.ObjectId, ref:"Station" },
    realm: {
      type: String,
    },
    accountStatus: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
    loginAttemptCount: { type: Number, default: 0 },
    lastModified: { type: Date },
    password: {
      type: String,
      // required: true,
      trim: true,
      minlength: 4,
      private: true,
    },
    PINHistory: [{ type: String }], // last PINs
  },
  {
    timestamps: true,
  }
);
userSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.PINHistory;
    delete ret.__v;
    delete ret.loginAttemptCount;
    delete ret.OTP;
    return ret;
  },
});

userSchema.statics.isPhoneTaken = async function (
  phoneNumber: string,
): Promise<boolean> {
  const user = await this.findOne({ phoneNumber, isDeleted: false });
  return !!user;
};

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

userSchema.pre<IUser>("save", async function (next) {
  if (!this.isNew) return next();
});

userSchema.methods.isPasswordMatch = async function (
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

export const User = model<IUser, IUserModel>("User", userSchema);
