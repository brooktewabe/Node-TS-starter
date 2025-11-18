import mongoose, { Schema } from 'mongoose';
import moment from 'moment-timezone';
import type { IRoute } from '../config/types/route.d.ts';

const RouteSchema = new Schema<IRoute>(
  {
    departure: { type: String, required: true},
    destination: { type: String, required: true},
    fee: { type: Number, required: true },
  },
  { timestamps: true }
);

// Add local timezone to timestamps
RouteSchema.pre<IRoute>('save', function (next) {
  const now = moment().tz('Africa/Addis_Ababa').format();
  if (this.isNew) {
    this.set({ createdAt: now });
  }
  this.set({ updatedAt: now });
  next();
});

RouteSchema.pre<IRoute>('findOneAndUpdate', function (next) {
  this.set({ updatedAt: moment().tz('Africa/Addis_Ababa').format() });
  next();
});

RouteSchema.set('toJSON', {
  transform: function (doc, ret: any) {
    delete ret.__v;
    return ret;
  },
});

export const Route = mongoose.model<IRoute>('Route', RouteSchema);
