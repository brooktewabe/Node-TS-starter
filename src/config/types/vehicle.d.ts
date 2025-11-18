import mongoose, { Document } from "mongoose"

export interface IVehicle extends Document{
    plateNumber: string;
    driverName: string;
    driverPhoneNumber: string;
    helperName?: string;
    vehicleType: string;
    capacity: number;
    routeId: mongoose.Types.ObjectId;
}