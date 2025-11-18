import mongoose, { Document } from "mongoose"

export interface ITicket extends Document{
    ticketNo: string;
    amountPaid: number;
    expiryDate: Date;
    commission: number;
    status: string;
    QRCode: string;
    vehicleId: mongoose.Types.ObjectId;
    accountId: mongoose.Types.ObjectId;
    routeId: mongoose.Types.ObjectId;
}

