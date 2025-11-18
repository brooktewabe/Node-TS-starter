import mongoose, { Document } from "mongoose"

export interface IRoute extends Document{
    departure: string;
    destination: string;
    fee: number;
}