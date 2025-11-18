import mongoose, { Document } from "mongoose"

export interface IStation extends Document{
    name: string;
    description: string;
}