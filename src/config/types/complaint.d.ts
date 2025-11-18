import mongoose, { Document } from "mongoose"

export interface IComplaint extends Document{
    vehicleId: mongoose.Types.ObjectId;
    description: string;
}