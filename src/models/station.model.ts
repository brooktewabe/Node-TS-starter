import mongoose, { Schema } from 'mongoose';
import moment from 'moment-timezone';
import type { IStation } from '../config/types/station.d.ts';

const StationSchema = new Schema<IStation>(
  {
    name: { type: String, required: true, unique: true},
    description: { type: String},
  },
  { timestamps: true }
);

// Add local timezone to timestamps
StationSchema.pre<IStation>('save', function (next) {
  const now = moment().tz('Africa/Addis_Ababa').format();
  if (this.isNew) {
    this.set({ createdAt: now });
  }
  this.set({ updatedAt: now });
  next();
});

StationSchema.pre<IStation>('findOneAndUpdate', function (next) {
  this.set({ updatedAt: moment().tz('Africa/Addis_Ababa').format() });
  next();
});

StationSchema.set('toJSON', {
  transform: function (doc, ret: any) {
    delete ret.__v;
    return ret;
  },
});

export const Station = mongoose.model<IStation>('Station', StationSchema);
