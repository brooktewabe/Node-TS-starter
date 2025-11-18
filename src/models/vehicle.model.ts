import mongoose, { Schema } from 'mongoose';
import moment from 'moment-timezone';
import type { IVehicle } from '../config/types/vehicle.js';

const VehicleSchema = new Schema<IVehicle>(
  {
    plateNumber: { type: String, required: true, unique: true},
    driverName: { type: String, required: true},
    driverPhoneNumber: { type: String, required: true},
    helperName: { type: String},
    vehicleType: { type: String},
    capacity: { type: Number, required: true },
    routeId: { type: Schema.Types.ObjectId, ref: 'Route', required: true },
  },
  { timestamps: true }
);

// Add local timezone to timestamps
VehicleSchema.pre<IVehicle>('save', function (next) {
  const now = moment().tz('Africa/Addis_Ababa').format();
  if (this.isNew) {
    this.set({ createdAt: now });
  }
  this.set({ updatedAt: now });
  next();
});

VehicleSchema.pre<IVehicle>('findOneAndUpdate', function (next) {
  this.set({ updatedAt: moment().tz('Africa/Addis_Ababa').format() });
  next();
});

VehicleSchema.set('toJSON', {
  transform: function (doc, ret: any) {
    delete ret.__v;
    return ret;
  },
});

export const Vehicle = mongoose.model<IVehicle>('Vehicle', VehicleSchema);
