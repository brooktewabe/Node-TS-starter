import mongoose, { Document } from "mongoose"

export interface IQueue extends Document{
    queueNo: number;
    status: string;
    vehicleId: mongoose.Types.ObjectId;
    routeId: mongoose.Types.ObjectId;
    seatAvailability: boolean;
}
