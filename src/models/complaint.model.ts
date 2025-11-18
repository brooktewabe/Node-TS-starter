import mongoose, { Schema } from 'mongoose';
import moment from 'moment-timezone';
import type { IComplaint } from '../config/types/complaint.d.ts';

const ComplaintSchema = new Schema<IComplaint>(
  {
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    description: { type: String},
  },
  { timestamps: true }
);

// Add local timezone to timestamps
ComplaintSchema.pre<IComplaint>('save', function (next) {
  const now = moment().tz('Africa/Addis_Ababa').format();
  if (this.isNew) {
    this.set({ createdAt: now });
  }
  this.set({ updatedAt: now });
  next();
});

ComplaintSchema.pre<IComplaint>('findOneAndUpdate', function (next) {
  this.set({ updatedAt: moment().tz('Africa/Addis_Ababa').format() });
  next();
});

ComplaintSchema.set('toJSON', {
  transform: function (doc, ret: any) {
    delete ret.__v;
    return ret;
  },
});

export const Complaint = mongoose.model<IComplaint>('Complaint', ComplaintSchema);
