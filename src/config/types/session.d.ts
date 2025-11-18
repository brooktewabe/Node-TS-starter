import { Document, Model } from "mongoose"

export interface ISession extends Document {
  userId: string,
  isActive: boolean,
  lastActivity: date,
}