import mongoose, { Document } from "mongoose"

export interface ICommission extends Document{
    ticketId: mongoose.Types.ObjectId;
    amount: number;
}