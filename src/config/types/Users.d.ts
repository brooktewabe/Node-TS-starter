import { Document, Model } from "mongoose"

export interface IUser extends Document {
  fullName: string;
  phoneNumber:string;
  realm:string;
  OTP: number;
  otpExpiry: number;
  isVerified: Boolean;
  role:string;
  accountStatus:string;
  password : string;
  loginAttemptCount: number;
  PINHistory: string[];
  permissionGroup: mongoose.Types.ObjectId[];
  stationId: mongoose.Types.ObjectId;
  lastModified: Date;
  createdAt: Date;
  updatedAt: Date;
  isPasswordMatch(password: string): Promise<boolean>;
}

export interface IUserModel extends Model<IUser> {
  isPhoneTaken(phoneNumber: string): Promise<boolean>;
}
