import mongoose, { model } from "mongoose";
import type { ISession } from "../config/types/session.d.ts";

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  isActive: { type: Boolean, default: true },
  lastActivity: { type: Date, default: Date.now },
}, { timestamps: true });

export const Session = model<ISession>("Session", sessionSchema);
